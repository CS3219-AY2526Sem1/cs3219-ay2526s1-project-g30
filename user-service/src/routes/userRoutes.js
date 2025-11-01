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
  verifyOtp,
  addCompletedQuestion,
  resendVerificationOtp,
  checkUsername
} = require('../controllers/userController');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true); // Accept the file
  } else {
    // Reject the file and provide an error message
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Public Routes
router.post('/register', registerUser); 
router.post('/login', loginUser);
router.get('/:username', getUserProfile);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);
router.post('/verify-otp', verifyOtp);
router.post('/resend-verification-otp', resendVerificationOtp);
router.post('/profile/add-completed-question', addCompletedQuestion);
router.post('/check-username', checkUsername);

// Private Routes (Protected by middleware)
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUserProfile);
router.put('/change-password', protect, changePassword);
router.put('/profile/picture', protect, upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;