const express = require('express');
const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const router = express.Router();
const validId = id => mongoose.isValidObjectId(id);
router.get('/', async (req, res, next) => {
  try {
    const month = Math.min(12, Math.max(1, Number(req.query.month) || new Date().getMonth() + 1));
    const year = Number(req.query.year) || new Date().getFullYear();
    const [budgets, spent] = await Promise.all([
      Budget.find({ userId: req.user._id, month, year }).populate('categoryId', 'name color archived').sort({ createdAt: 1 }).lean(),
      Expense.aggregate([{ $match: { userId: req.user._id, date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) } } }, { $group: { _id: '$categoryId', total: { $sum: '$amount' } } }]),
    ]);
    const spentMap = new Map(spent.map(x => [String(x._id), x.total]));
    res.json({ budgets: budgets.map(b => ({ ...b, spent: spentMap.get(String(b.categoryId?._id)) || 0, remaining: b.amount - (spentMap.get(String(b.categoryId?._id)) || 0) })) });
  } catch (e) { next(e); }
});
router.post('/', async (req, res, next) => {
  try {
    const { categoryId } = req.body; const amount = Number(req.body.amount); const month = Number(req.body.month); const year = Number(req.body.year);
    if (!validId(categoryId) || !(await Category.exists({ _id: categoryId, userId: req.user._id }))) return res.status(400).json({ message: 'Choose a valid category.' });
    if (!Number.isSafeInteger(amount) || amount < 1) return res.status(400).json({ message: 'Budget must be a positive whole number.' });
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) return res.status(400).json({ message: 'Choose a valid month and year.' });
    const budget = await Budget.findOneAndUpdate({ userId: req.user._id, categoryId, month, year }, { $set: { amount } }, { upsert: true, new: true, runValidators: true }).populate('categoryId', 'name color');
    res.status(201).json({ budget });
  } catch (e) { next(e); }
});
router.delete('/:id', async (req, res, next) => { try { if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid budget ID.' }); const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id }); if (!budget) return res.status(404).json({ message: 'Budget not found.' }); res.json({ message: 'Budget deleted.' }); } catch (e) { next(e); } });
module.exports = router;
