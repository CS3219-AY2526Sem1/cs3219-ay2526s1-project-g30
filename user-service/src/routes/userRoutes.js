const express = require('express');
const router = express.Router();
const path = require('path');
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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage: storage });

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