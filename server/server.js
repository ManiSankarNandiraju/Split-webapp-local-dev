// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/Groups'); // Import the new group routes
const db = require('./db'); // MongoDB connection file
const expenseRoutes = require('./routes/expenses');


const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.use('/api/expenses', expenseRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes); // Use group routes

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
