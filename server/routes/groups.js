// routes/groups.js
const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');  // Import the User model
const router = express.Router();

// Create Group Route
router.post('/create', async (req, res) => {
  const { name, members, createdBy } = req.body; // Ensure createdBy is part of the request body

  try {
    const newGroup = new Group({
      name,
      members,
      createdBy, // Include createdBy
    });

    await newGroup.save();
    res.json({ success: true, groupId: newGroup._id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating group' });
  }
});



// Get All Groups Route (for Dashboard)
router.get('/all', async (req, res) => {
  try {
    const groups = await Group.find(); // Fetch all groups
    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching groups' });
  }
});

// Get Group by ID Route
router.get('/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await Group.findById(groupId); // Fetch group by ID
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching group' });
  }
});

// Fetch Groups Associated with a User
router.get('/all/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch the user's phone number
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const phone = user.phone;

    // Fetch groups where the user is either the creator or a member
    const groups = await Group.find({
      $or: [
        { "createdBy._id": userId }, // User is the creator
        { "members.phone": phone },   // User is a member
      ],
    });

    res.json({ success: true, groups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, message: 'Error fetching groups' });
  }
});

// Get all expenses for a group
router.get('/group-expenses/:groupId', async (req, res) => {
  const { groupId } = req.params;

  try {
    const expenses = await Expense.find({ groupId }).populate('groupId');
    res.json({ success: true, expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ success: false, message: 'Error fetching expenses' });
  }
});


module.exports = router;