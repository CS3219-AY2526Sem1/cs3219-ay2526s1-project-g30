const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');

const {
  registerUser,
  getUserProfile,
  loginUser,
  updateUserProfile,
  deleteUserProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  uploadProfilePicture,
  verifyEmail,
  addCompletedQuestion,
} = require('../controllers/userController');

const storage = multer.memoryStorage();

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Public Routes
router.post('/register', registerUser); 
router.post('/login', loginUser);
router.get('/verify-email/:token', verifyEmail);
router.get('/:id', getUserProfile);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Private Routes (Protected by middleware)
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUserProfile);
router.put('/change-password', protect, changePassword);
router.put('/profile/picture', protect, upload.single('profilePicture'), uploadProfilePicture);
router.post('/profile/questions-completed', protect, addCompletedQuestion);

module.exports = router;