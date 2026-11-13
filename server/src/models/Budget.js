const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  amount: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true, min: 2000, max: 2100 },
}, { timestamps: true });
schema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });
module.exports = mongoose.model('Budget', schema);
