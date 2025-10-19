const express = require('express');
const path = require('path');
require('dotenv').config(); // Loads environment variables from .env file
const connectDB = require('./src/config/db');
const userRoutes = require('./src/routes/userRoutes');

// Connect to the MongoDB database
connectDB();

const app = express();

// Middleware to parse incoming JSON requests
// This allows us to access request body data via req.body
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define a basic route for the root URL
app.get('/', (req, res) => {
  res.send('User Service API is running...');
});

// Mount the user routes
// Any request to '/api/users' will be handled by userRoutes
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`User service running on port ${PORT}`));