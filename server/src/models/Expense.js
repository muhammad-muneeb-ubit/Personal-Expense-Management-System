const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  description: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
  date: { type: Date, required: true, index: true },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Bank', 'Digital wallet'], default: 'Cash' },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });
schema.index({ userId: 1, date: -1 });
module.exports = mongoose.model('Expense', schema);
