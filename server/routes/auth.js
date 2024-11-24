const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const Group = require('../models/Group'); // Ensure the path is correct
// Register Route
router.post('/register', async (req, res) => {
  const { username, email, phone, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if the phone exists in any group's members
    const matchingGroups = await Group.find({ "members.phone": phone });

    if (matchingGroups.length > 0) {
      // If phone matches, create a new user and update group members
      const newUser = new User({ username, email, phone, password: hashedPassword });
      await newUser.save();

      // Update group members
      for (let group of matchingGroups) {
        group.members = group.members.map((member) =>
          member.phone === phone
            ? { ...member, name: username, email: email } // Update the matching member's details
            : member
        );
        await group.save(); // Save the updated group
      }

      return res.json({
        success: true,
        message: 'User registered and linked to existing group(s)',
        userId: newUser._id,
      });
    } else {
      // If no match, create a regular user
      const newUser = new User({ username, email, phone, password: hashedPassword });
      await newUser.save();

      return res.json({
        success: true,
        message: 'User registered successfully',
        userId: newUser._id,
      });
    }
  } catch (error) {
    console.error('Error in registration:', error);
    res.status(500).json({ success: false, message: 'Error registering user', error: error.message });
  }
});



// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid password' });
    }

    // Generate a token with the user's ID
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

    // Respond with the token and user details
    res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging in' });
  }
});

module.exports = router;
