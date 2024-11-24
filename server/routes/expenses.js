// routes/expenses.js
const express = require('express');
const Expense = require('../models/Expense');
const Group = require('../models/Group');
const router = express.Router();

// Add an expense to a group
router.post('/add-expense', async (req, res) => {
  const { groupId, description, amount, paidBy, splitBetween, splitType } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    // Calculate split amounts
    let splits = [];
    if (splitType === 'equal') {
      const splitAmount = amount / splitBetween.length;
      splits = splitBetween.map((member) => ({
        username: member.username,
        phone: member.phone,
        amount: splitAmount,
      }));
    } else {
      splits = splitBetween; // Expect client sends individual amounts for unequal split
    }

    // Create the expense
    const expense = new Expense({
      description,
      amount,
      groupId,
      paidBy,
      splitDetails: splits,
    });

    await expense.save();
    res.json({ success: true, message: 'Expense added successfully', expense });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ success: false, message: 'Error adding expense' });
  }
});

// Fetch Group Expenses
router.get('/group-expenses/:groupId', async (req, res) => {
    const { groupId } = req.params;
    try {
      const expenses = await Expense.find({ groupId }).populate('paidBy', 'name phone');
      res.json({ success: true, expenses });
    } catch (error) {
      console.error('Error fetching group expenses:', error);
      res.status(500).json({ success: false, message: 'Error fetching group expenses' });
    }
});

// Fetch User Balances
router.get('/user-balance/:phone', async (req, res) => {
    const { phone } = req.params;
    try {
      const expenses = await Expense.find({
        $or: [
          { paidBy: phone },
          { 'splitDetails.phone': phone }
        ]
      });

      let balances = {};
      expenses.forEach(expense => {
        const totalAmount = expense.amount;
        const payer = expense.paidBy;
        const splitDetails = expense.splitDetails;

        splitDetails.forEach(split => {
          if (split.phone !== payer) {
            if (split.phone === phone) {
              // This user owes money
              balances[payer] = (balances[payer] || 0) + split.amount;
            } else if (payer === phone) {
              // Others owe money to this user
              balances[split.phone] = (balances[split.phone] || 0) - split.amount;
            }
          }
        });
      });

      res.json({ success: true, balances });
    } catch (error) {
      console.error('Error fetching user balances:', error);
      res.status(500).json({ success: false, message: 'Error fetching user balances' });
    }
});

// Settle Up Balances
router.post('/settle-up', async (req, res) => {
    const { payerPhone, payeePhone, amount } = req.body;
    try {
      const expenses = await Expense.find({
        $or: [
          { paidBy: payerPhone, 'splitDetails.phone': payeePhone },
          { paidBy: payeePhone, 'splitDetails.phone': payerPhone }
        ]
      });

      let remainingAmount = amount;

      for (const expense of expenses) {
        if (remainingAmount <= 0) break;

        expense.splitDetails.forEach(split => {
          if (
            (expense.paidBy === payerPhone && split.phone === payeePhone) ||
            (expense.paidBy === payeePhone && split.phone === payerPhone)
          ) {
            const adjustment = Math.min(split.amount, remainingAmount);
            split.amount -= adjustment;
            remainingAmount -= adjustment;
          }
        });

        await expense.save();
      }

      res.json({ success: true, message: 'Balance settled successfully' });
    } catch (error) {
      console.error('Error settling balances:', error);
      res.status(500).json({ success: false, message: 'Error settling balances' });
    }
});

module.exports = router;
