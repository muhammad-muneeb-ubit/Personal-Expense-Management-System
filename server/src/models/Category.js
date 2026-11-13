const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 40 },
  color: { type: String, default: '#7770f5', match: /^#[0-9a-fA-F]{6}$/ },
  icon: { type: String, default: 'tag', maxlength: 30 },
  archived: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ userId: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('Category', schema);
