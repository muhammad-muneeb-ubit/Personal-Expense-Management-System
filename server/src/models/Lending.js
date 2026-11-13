
const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isSafeInteger,
  },
  date: {
    type: Date,
    required: true,
  },
  note: {
    type: String,
    trim: true,
    maxlength: 200,
    default: '',
  },
});

const lendingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  personName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 70,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
    validate: Number.isSafeInteger,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expectedReturnDate: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  repayments: {
    type: [repaymentSchema],
    default: [],
  },
}, { timestamps: true });

lendingSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Lending', lendingSchema);
