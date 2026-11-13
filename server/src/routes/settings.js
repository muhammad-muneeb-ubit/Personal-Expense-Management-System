const express = require('express');
const User = require('../models/User');
const router = express.Router();
router.patch('/profile', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim(); const currency = String(req.body.currency || 'PKR');
    if (name.length < 2 || name.length > 70) return res.status(400).json({ message: 'Name must be between 2 and 70 characters.' });
    if (!['PKR', 'USD', 'EUR', 'GBP'].includes(currency)) return res.status(400).json({ message: 'Unsupported currency.' });
    const user = await User.findByIdAndUpdate(req.user._id, { name, currency }, { new: true });
    res.json({ user: { id: user._id, name: user.name, email: user.email, currency: user.currency, emailVerified: Boolean(user.emailVerifiedAt) } });
  } catch (e) { next(e); }
});
module.exports = router;
