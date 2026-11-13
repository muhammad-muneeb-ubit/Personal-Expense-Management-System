const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Category = require('../models/Category');
const RefreshSession = require('../models/RefreshSession');
const OneTimeToken = require('../models/OneTimeToken');
const requireAuth = require('../middleware/auth');
const sendActionEmail = require('../utils/email');
const { hashToken, accessToken, createRefreshSession, cookieOptions } = require('../utils/tokens');
const router = express.Router();
const clientUrl = () => (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim();
function requireTrustedOrigin(req, res, next) {
  const origin = req.get('origin');
  const allowed = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map(x => x.trim());
  if (!origin && process.env.NODE_ENV !== 'production') return next();
  if (!origin || !allowed.includes(origin)) return res.status(403).json({ message: 'Request origin is not allowed.' });
  next();
}
const safeUser = user => ({ id: user._id, name: user.name, email: user.email, currency: user.currency, emailVerified: Boolean(user.emailVerifiedAt) });
const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
const issueOneTimeToken = async (user, purpose) => {
  const raw = crypto.randomBytes(32).toString('base64url');
  await OneTimeToken.create({ userId: user._id, tokenHash: hashToken(raw), purpose, expiresAt: new Date(Date.now() + (purpose === 'verify-email' ? 24 : 1) * 3600000) });
  return raw;
};
async function startSession(user, req, res) {
  const refresh = await createRefreshSession(user, req);
  res.cookie('pw_refresh', refresh, cookieOptions());
  return { accessToken: accessToken(user), user: safeUser(user) };
}

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2 || name.length > 70) return res.status(400).json({ message: 'Name must be between 2 and 70 characters.' });
    if (!validEmail(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return res.status(400).json({ message: 'Password must be at least 10 characters and include uppercase, lowercase and a number.' });
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    const defaults = [
      ['Food & Dining', '#7770f5', 'utensils'], ['Transport', '#26b6a6', 'car'], ['Shopping', '#f4a340', 'shopping-bag'],
      ['Bills & Utilities', '#ed7194', 'house'], ['Health', '#48a9e6', 'heart-pulse'], ['Education', '#9b7bea', 'graduation-cap'], ['Other', '#9297a8', 'tag'],
    ];
    await Category.insertMany(defaults.map(([categoryName, color, icon]) => ({ userId: user._id, name: categoryName, color, icon })));
    const token = await issueOneTimeToken(user, 'verify-email');
    await sendActionEmail({ to: user.email, subject: 'Verify your Pocketwise email', text: `Welcome to Pocketwise. Verify your email: ${clientUrl()}/verify-email?token=${token}` });
    const session = await startSession(user, req, res);
    res.status(201).json({ ...session, message: 'Account created. Check your email for a verification link.' });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    const session = await startSession(user, req, res);
    res.json(session);
  } catch (error) { next(error); }
});

router.post('/refresh', requireTrustedOrigin, async (req, res, next) => {
  try {
    const raw = req.cookies.pw_refresh;
    if (!raw) return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    const tokenHash = hashToken(raw);
    const session = await RefreshSession.findOne({ tokenHash });
    if (!session) { res.clearCookie('pw_refresh', cookieOptions()); return res.status(401).json({ message: 'Session expired. Please sign in again.' }); }
    if (session.revokedAt) {
      await RefreshSession.updateMany({ userId: session.userId, revokedAt: null }, { revokedAt: new Date() });
      res.clearCookie('pw_refresh', cookieOptions());
      return res.status(401).json({ message: 'Session reuse detected. Please sign in again on this device.' });
    }
    if (session.expiresAt <= new Date()) { session.revokedAt = new Date(); await session.save(); res.clearCookie('pw_refresh', cookieOptions()); return res.status(401).json({ message: 'Session expired. Please sign in again.' }); }
    const user = await User.findById(session.userId);
    if (!user) { res.clearCookie('pw_refresh', cookieOptions()); return res.status(401).json({ message: 'Account not found.' }); }
    const nextRaw = await createRefreshSession(user, req);
    const nextHash = hashToken(nextRaw);
    session.revokedAt = new Date(); session.replacedByTokenHash = nextHash; await session.save();
    res.cookie('pw_refresh', nextRaw, cookieOptions());
    res.json({ accessToken: accessToken(user), user: safeUser(user) });
  } catch (error) { next(error); }
});

router.post('/logout', requireTrustedOrigin, async (req, res, next) => {
  try {
    if (req.cookies.pw_refresh) await RefreshSession.updateOne({ tokenHash: hashToken(req.cookies.pw_refresh), revokedAt: null }, { revokedAt: new Date() });
    res.clearCookie('pw_refresh', cookieOptions());
    res.json({ message: 'Signed out successfully.' });
  } catch (error) { next(error); }
});
router.get('/me', requireAuth, (req, res) => res.json({ user: safeUser(req.user) }));

router.post('/verify-email', async (req, res, next) => {
  try {
    const raw = String(req.body.token || '');
    const record = await OneTimeToken.findOne({ tokenHash: hashToken(raw), purpose: 'verify-email', usedAt: null, expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ message: 'This verification link is invalid or expired.' });
    record.usedAt = new Date(); await record.save();
    await User.findByIdAndUpdate(record.userId, { emailVerifiedAt: new Date() });
    res.json({ message: 'Email verified successfully.' });
  } catch (error) { next(error); }
});
router.post('/resend-verification', requireAuth, async (req, res, next) => {
  try {
    if (req.user.emailVerifiedAt) return res.json({ message: 'Your email is already verified.' });
    const token = await issueOneTimeToken(req.user, 'verify-email');
    await sendActionEmail({ to: req.user.email, subject: 'Verify your Pocketwise email', text: `Verify your email: ${clientUrl()}/verify-email?token=${token}` });
    res.json({ message: 'If your email is eligible, a verification link has been sent.' });
  } catch (error) { next(error); }
});
router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email });
    if (user) {
      const token = await issueOneTimeToken(user, 'reset-password');
      await sendActionEmail({ to: user.email, subject: 'Reset your Pocketwise password', text: `Reset your password within one hour: ${clientUrl()}/reset-password?token=${token}` });
    }
    res.json({ message: 'If an account exists for that email, a password reset link has been sent.' });
  } catch (error) { next(error); }
});
router.post('/reset-password', async (req, res, next) => {
  try {
    const raw = String(req.body.token || ''); const password = String(req.body.password || '');
    if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return res.status(400).json({ message: 'Password must be at least 10 characters and include uppercase, lowercase and a number.' });
    const record = await OneTimeToken.findOne({ tokenHash: hashToken(raw), purpose: 'reset-password', usedAt: null, expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ message: 'This password reset link is invalid or expired.' });
    await User.findByIdAndUpdate(record.userId, { passwordHash: await bcrypt.hash(password, 12) });
    record.usedAt = new Date(); await record.save();
    await RefreshSession.updateMany({ userId: record.userId, revokedAt: null }, { revokedAt: new Date() });
    res.json({ message: 'Password reset. Please sign in with your new password.' });
  } catch (error) { next(error); }
});
router.post('/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!(await bcrypt.compare(String(currentPassword || ''), user.passwordHash))) return res.status(400).json({ message: 'Current password is incorrect.' });
    const password = String(newPassword || '');
    if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return res.status(400).json({ message: 'New password must be at least 10 characters and include uppercase, lowercase and a number.' });
    user.passwordHash = await bcrypt.hash(password, 12); await user.save();
    await RefreshSession.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
    res.clearCookie('pw_refresh', cookieOptions());
    res.json({ message: 'Password changed. Please sign in again.' });
  } catch (error) { next(error); }
});
module.exports = router;
