const express = require('express');
const router = express.Router();

// Import the controller function
const { registerUser } = require('../controllers/userController');

// Define the route for registering a new user
// This associates the POST request on '/' (which becomes '/api/users/') with the registerUser function
router.post('/', registerUser);

// You will add other routes here later, for example:
// router.post('/login', loginUser);
// router.get('/:id', getUserProfile);

// CRUCIAL: Export the router so it can be used in index.js
module.exports = router;