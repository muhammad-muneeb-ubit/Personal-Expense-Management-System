const express = require('express');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const router = express.Router();
router.get('/dashboard', async (req, res, next) => {
  try {
    const now = new Date(); const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1); const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const userId = req.user._id;
    const [current, previous, budgetTotal, categoryRows, trendRows, recent] = await Promise.all([
      Expense.aggregate([{ $match: { userId, date: { $gte: monthStart, $lt: nextMonth } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
      Expense.aggregate([{ $match: { userId, date: { $gte: previousStart, $lt: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Budget.aggregate([{ $match: { userId, month: now.getMonth() + 1, year: now.getFullYear() } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { userId, date: { $gte: monthStart, $lt: nextMonth } } }, { $group: { _id: '$categoryId', total: { $sum: '$amount' } } }, { $sort: { total: -1 } }, { $limit: 8 }, { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } }, { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }, { $project: { name: '$category.name', color: '$category.color', amount: '$total' } }]),
      Expense.aggregate([{ $match: { userId, date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1), $lt: nextMonth } } }, { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }]),
      Expense.find({ userId }).populate('categoryId', 'name color').sort({ date: -1 }).limit(6).lean(),
    ]);
    res.json({ summary: { spent: current[0]?.total || 0, count: current[0]?.count || 0, budget: budgetTotal[0]?.total || 0, previousSpent: previous[0]?.total || 0 }, categories: categoryRows, trend: trendRows.map(x => ({ month: new Date(x._id.year, x._id.month - 1, 1).toLocaleString('en', { month: 'short' }), year: x._id.year, amount: x.total })), recent });
  } catch (e) { next(e); }
});
router.get('/reports', async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const from = new Date(year, 0, 1); const to = new Date(year + 1, 0, 1); const userId = req.user._id;
    const [monthly, categories, totals] = await Promise.all([
      Expense.aggregate([{ $match: { userId, date: { $gte: from, $lt: to } } }, { $group: { _id: { month: { $month: '$date' } }, amount: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { '_id.month': 1 } }]),
      Expense.aggregate([{ $match: { userId, date: { $gte: from, $lt: to } } }, { $group: { _id: '$categoryId', amount: { $sum: '$amount' } } }, { $sort: { amount: -1 } }, { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } }, { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }, { $project: { name: '$category.name', color: '$category.color', amount: 1 } }]),
      Expense.aggregate([{ $match: { userId, date: { $gte: from, $lt: to } } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 }, average: { $avg: '$amount' } } }]),
    ]);
    const byMonth = Array.from({ length: 12 }, (_, i) => ({ month: new Date(year, i, 1).toLocaleString('en', { month: 'short' }), amount: monthly.find(x => x._id.month === i + 1)?.amount || 0, count: monthly.find(x => x._id.month === i + 1)?.count || 0 }));
    res.json({ year, monthly: byMonth, categories, totals: totals[0] || { total: 0, count: 0, average: 0 } });
  } catch (e) { next(e); }
});
module.exports = router;
