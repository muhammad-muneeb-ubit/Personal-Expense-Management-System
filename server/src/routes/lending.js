
const express = require('express');
const mongoose = require('mongoose');
const Lending = require('../models/Lending');

const router = express.Router();
const validId = id => mongoose.isValidObjectId(id);

function calculateBalance(record) {
  const repaid = record.repayments.reduce(
    (total, repayment) => total + repayment.amount, 0
  );

  return {
    totalRepaid: repaid,
    outstanding: record.amount - repaid,
    status: repaid === 0
      ? 'Pending'
      : repaid === record.amount
        ? 'Paid'
        : 'Partially paid',
  };
}

function serialize(record) {
  const item = record.toObject ? record.toObject() : record;
  return { ...item, ...calculateBalance(item) };
}

// Get all lending records
router.get('/', async (req, res, next) => {
  try {
    const records = await Lending.find({
      userId: req.user._id,
    }).sort({ date: -1, createdAt: -1 }).lean();

    const lendings = records.map(serialize);

    res.json({
      lendings,
      summary: {
        totalLent: lendings.reduce((sum, x) => sum + x.amount, 0),
        totalRepaid: lendings.reduce((sum, x) => sum + x.totalRepaid, 0),
        outstanding: lendings.reduce((sum, x) => sum + x.outstanding, 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create a lending record
router.post('/', async (req, res, next) => {
  try {
    const personName = String(req.body.personName || '').trim();
    const amount = Number(req.body.amount);
    const date = new Date(req.body.date);
    const expectedReturnDate = req.body.expectedReturnDate
      ? new Date(req.body.expectedReturnDate)
      : null;

    if (!personName || personName.length > 70) {
      return res.status(400).json({ message: 'Enter a valid person name.' });
    }

    if (!Number.isSafeInteger(amount) || amount < 1) {
      return res.status(400).json({ message: 'Enter a valid positive amount.' });
    }

    if (!req.body.date || Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Enter a valid lending date.' });
    }

    if (expectedReturnDate && Number.isNaN(expectedReturnDate.getTime())) {
      return res.status(400).json({ message: 'Enter a valid expected return date.' });
    }

    const lending = await Lending.create({
      userId: req.user._id,
      personName,
      amount,
      date,
      expectedReturnDate,
      notes: String(req.body.notes || '').slice(0, 500),
    });

    res.status(201).json({ lending: serialize(lending) });
  } catch (error) {
    next(error);
  }
});

// Edit a lending record
router.patch('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lending ID.' });
    }

    const lending = await Lending.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!lending) {
      return res.status(404).json({ message: 'Lending record not found.' });
    }

    if (req.body.personName !== undefined) {
      const name = String(req.body.personName).trim();
      if (!name || name.length > 70) {
        return res.status(400).json({ message: 'Enter a valid person name.' });
      }
      lending.personName = name;
    }

    if (req.body.amount !== undefined) {
      const amount = Number(req.body.amount);
      const alreadyRepaid = lending.repayments.reduce((sum, r) => sum + r.amount, 0);

      if (!Number.isSafeInteger(amount) || amount < 1 || amount < alreadyRepaid) {
        return res.status(400).json({
          message: 'Amount must be valid and cannot be less than the amount already repaid.',
        });
      }
      lending.amount = amount;
    }

    if (req.body.date !== undefined) {
      const date = new Date(req.body.date);
      if (Number.isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid lending date.' });
      }
      lending.date = date;
    }

    if (req.body.expectedReturnDate !== undefined) {
      const date = req.body.expectedReturnDate
        ? new Date(req.body.expectedReturnDate)
        : null;

      if (date && Number.isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Invalid expected return date.' });
      }
      lending.expectedReturnDate = date;
    }

    if (req.body.notes !== undefined) {
      lending.notes = String(req.body.notes).slice(0, 500);
    }

    await lending.save();

    res.json({ lending: serialize(lending) });
  } catch (error) {
    next(error);
  }
});

// Add a repayment
router.post('/:id/repayments', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lending ID.' });
    }

    const lending = await Lending.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!lending) {
      return res.status(404).json({ message: 'Lending record not found.' });
    }

    const amount = Number(req.body.amount);
    const date = new Date(req.body.date || Date.now());
    const alreadyRepaid = lending.repayments.reduce((sum, r) => sum + r.amount, 0);
    const outstanding = lending.amount - alreadyRepaid;

    if (!Number.isSafeInteger(amount) || amount < 1 || amount > outstanding) {
      return res.status(400).json({
        message: `Repayment must be between 1 and ${outstanding}.`,
      });
    }

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid repayment date.' });
    }

    lending.repayments.push({
      amount,
      date,
      note: String(req.body.note || '').slice(0, 200),
    });

    await lending.save();

    res.status(201).json({ lending: serialize(lending) });
  } catch (error) {
    next(error);
  }
});

// Delete a lending record
router.delete('/:id', async (req, res, next) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid lending ID.' });
    }

    const deleted = await Lending.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Lending record not found.' });
    }

    res.json({ message: 'Lending record deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
