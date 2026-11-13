const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const router = express.Router();
const validId = id => mongoose.isValidObjectId(id);
router.get('/', async (req, res, next) => { try { const categories = await Category.find({ userId: req.user._id }).sort({ archived: 1, name: 1 }).lean(); res.json({ categories }); } catch (e) { next(e); } });
router.post('/', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim(); const color = req.body.color || '#7770f5'; const icon = String(req.body.icon || 'tag');
    if (name.length < 2 || name.length > 40) return res.status(400).json({ message: 'Category name must be 2–40 characters.' });
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return res.status(400).json({ message: 'Choose a valid category color.' });
    const category = await Category.create({ userId: req.user._id, name, color, icon }); res.status(201).json({ category });
  } catch (e) { if (e.code === 11000) return res.status(409).json({ message: 'You already have a category with this name.' }); next(e); }
});
router.patch('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid category ID.' });
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    if (req.body.name !== undefined) { const name = String(req.body.name).trim(); if (name.length < 2 || name.length > 40) return res.status(400).json({ message: 'Category name must be 2–40 characters.' }); category.name = name; }
    if (req.body.color !== undefined) { if (!/^#[0-9a-fA-F]{6}$/.test(req.body.color)) return res.status(400).json({ message: 'Choose a valid category color.' }); category.color = req.body.color; }
    if (req.body.archived !== undefined) category.archived = Boolean(req.body.archived);
    await category.save(); res.json({ category });
  } catch (e) { if (e.code === 11000) return res.status(409).json({ message: 'You already have a category with this name.' }); next(e); }
});
router.delete('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid category ID.' });
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) return res.status(404).json({ message: 'Category not found.' });
    const [hasExpenses, hasBudgets] = await Promise.all([Expense.exists({ userId: req.user._id, categoryId: category._id }), Budget.exists({ userId: req.user._id, categoryId: category._id })]);
    if (hasExpenses || hasBudgets) { category.archived = true; await category.save(); return res.json({ message: 'Category archived because it has financial history.' }); }
    await category.deleteOne(); res.json({ message: 'Category deleted.' });
  } catch (e) { next(e); }
});
module.exports = router;
