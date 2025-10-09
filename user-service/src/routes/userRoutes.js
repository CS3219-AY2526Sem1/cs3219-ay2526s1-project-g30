const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  registerUser,
  getUserProfile,
  loginUser,
  updateUserProfile,
  deleteUserProfile,
} = require('../controllers/userController');

// Public Routes
router.post('/register', registerUser); 
router.post('/login', loginUser);
router.get('/:id', getUserProfile);

// Private Routes (Protected by middleware)
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUserProfile);

module.exports = router;