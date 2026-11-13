const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshSession = require('../models/RefreshSession');

const hashToken = value => crypto.createHash('sha256').update(value).digest('hex');
function accessToken(user) {
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) throw new Error('JWT_ACCESS_SECRET must be at least 32 characters.');
  return jwt.sign({ sub: user._id.toString(), email: user.email }, process.env.JWT_ACCESS_SECRET, { expiresIn: `${Number(process.env.ACCESS_TOKEN_MINUTES || 15)}m`, issuer: 'pocketwise-api', audience: 'pocketwise-client' });
}
async function createRefreshSession(user, req) {
  const raw = crypto.randomBytes(48).toString('base64url');
  const days = Number(process.env.REFRESH_TOKEN_DAYS || 30);
  await RefreshSession.create({ userId: user._id, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + days * 86400000), userAgent: req.get('user-agent') || '' });
  return raw;
}
function cookieOptions() {
  return { httpOnly: true, secure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production', sameSite: process.env.COOKIE_SAME_SITE || 'strict', path: '/api/auth', maxAge: Number(process.env.REFRESH_TOKEN_DAYS || 30) * 86400000 };
}
module.exports = { hashToken, accessToken, createRefreshSession, cookieOptions };
