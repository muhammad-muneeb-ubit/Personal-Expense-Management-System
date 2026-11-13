const express = require('express');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const router = express.Router();
const validId = id => mongoose.isValidObjectId(id);
const parseExpense = async (body, userId) => {
  const description = String(body.description || '').trim(); const amount = Number(body.amount); const date = new Date(body.date);
  if (!description || description.length > 100) throw Object.assign(new Error('Description is required (maximum 100 characters).'), { status: 400 });
  if (!Number.isSafeInteger(amount) || amount < 1) throw Object.assign(new Error('Amount must be a positive whole number.'), { status: 400 });
  if (!body.categoryId || !validId(body.categoryId)) throw Object.assign(new Error('Choose a valid category.'), { status: 400 });
  const category = await Category.findOne({ _id: body.categoryId, userId, archived: false });
  if (!category) throw Object.assign(new Error('Category not found or archived.'), { status: 400 });
  if (!body.date || Number.isNaN(date.getTime())) throw Object.assign(new Error('Choose a valid expense date.'), { status: 400 });
  const paymentMethod = body.paymentMethod || 'Cash';
  if (!['Cash', 'Card', 'Bank', 'Digital wallet'].includes(paymentMethod)) throw Object.assign(new Error('Invalid payment method.'), { status: 400 });
  return { description, amount, categoryId: category._id, date, paymentMethod, notes: String(body.notes || '').slice(0, 500) };
};
router.get('/', async (req, res, next) => {
  try {
    const query = { userId: req.user._id };
    if (req.query.from || req.query.to) { query.date = {}; if (req.query.from) query.date.$gte = new Date(req.query.from); if (req.query.to) { const end = new Date(req.query.to); end.setHours(23,59,59,999); query.date.$lte = end; } }
    if (req.query.categoryId && validId(req.query.categoryId)) query.categoryId = req.query.categoryId;
    if (req.query.search) query.description = { $regex: String(req.query.search).slice(0, 60).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const expenses = await Expense.find(query).populate('categoryId', 'name color icon').sort({ date: -1, createdAt: -1 }).limit(1000).lean();
    res.json({ expenses });
  } catch (e) { next(e); }
});
router.post('/', async (req, res, next) => { try { const values = await parseExpense(req.body, req.user._id); const expense = await Expense.create({ ...values, userId: req.user._id }); await expense.populate('categoryId', 'name color icon'); res.status(201).json({ expense }); } catch (e) { next(e); } });
router.patch('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid expense ID.' });
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id }); if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    const values = await parseExpense({ ...expense.toObject(), ...req.body }, req.user._id); Object.assign(expense, values); await expense.save(); await expense.populate('categoryId', 'name color icon'); res.json({ expense });
  } catch (e) { next(e); }
});
router.delete('/:id', async (req, res, next) => { try { if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid expense ID.' }); const result = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id }); if (!result) return res.status(404).json({ message: 'Expense not found.' }); res.json({ message: 'Expense deleted.' }); } catch (e) { next(e); } });
module.exports = router;
