const jwt = require('jsonwebtoken');
const User = require('../models/User');
async function requireAuth(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { issuer: 'pocketwise-api', audience: 'pocketwise-client' });
    const user = await User.findById(payload.sub).select('_id name email currency emailVerifiedAt');
    if (!user) return res.status(401).json({ message: 'Your session is no longer valid. Please sign in again.' });
    req.user = user;
    next();
  } catch (error) { return res.status(401).json({ message: 'Your session has expired. Please sign in again.' }); }
}
module.exports = requireAuth;
