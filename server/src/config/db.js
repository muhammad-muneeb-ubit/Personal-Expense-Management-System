const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing from server/.env');
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DATABASE || 'expense_manager' });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}
module.exports = connectDB;
