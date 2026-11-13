
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 70
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  dateOfBirth: {
    type: String,
    default: null
  },
  currency: {
    type: String,
    enum: ['PKR', 'USD', 'EUR', 'GBP'],
    default: 'PKR'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
 