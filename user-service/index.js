// AI Assistance Disclosure:
// Tool: Google Gemini AI (Model: PRO) date: 2025-10-09
// Scope: Generated implementation based on my requirements.
// Author review: Validated correctness.

const express = require('express');
require('dotenv').config();
const connectDB = require('./src/config/db');
const userRoutes = require('./src/routes/userRoutes');

connectDB();

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('User Service API is running...');
});

app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`User service running on port ${PORT}`));