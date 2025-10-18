const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Built-in Node.js library
const sendEmail = require('../utils/sendEmail'); // Import the email utility

exports.registerUser = async (req, res) => {
  const { username, email, password } = req.body; 

  try {
    const user = await User.create({
      username,
      email,
      password,
    });
    
    res.status(201).json({ message: 'User registered successfully', userId: user._id });

  } catch (err) {
    console.error(err); 
    res.status(500).send('Server Error');
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    // Find the user by the ID provided in the URL parameter
    // .select('-password') ensures the hashed password is not sent back
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email. We must use .select('+password') to get the password
    // because we set select: false in the model.
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare the plaintext password from the request with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // User is valid, create a JWT
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // You need to add JWT_SECRET to your .env file
      { expiresIn: '5h' }, // Token expires in 5 hours
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

exports.updateUserProfile = async (req, res) => {
  // The user object is attached to the request in the 'protect' middleware
  const user = await User.findById(req.user.id);

  if (user) {
    // Update fields if they are provided in the request body
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.gender = req.body.gender || user.gender;
    user.aboutMeInformation = req.body.aboutMeInformation || user.aboutMeInformation;
    user.skillLevel = req.body.skillLevel || user.skillLevel;
    user.preferredTopics = req.body.preferredTopics || user.preferredTopics;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      // ...return any other fields you want
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

exports.deleteUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password +passwordHistory');

  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid current password' });
  
  if (await user.isPasswordReused(newPassword)) {
    return res.status(400).json({ message: 'You cannot reuse an old password.' });
  }

  user.passwordHistory.push(user.password);
  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
};

exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return res.json({ message: 'If a user with that email exists, a reset link has been sent.' });
  }

  const resetToken = crypto.randomBytes(20).toString('hex');

  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
  const message = `Forgot your password? Please click the link below to set a new one. This link is valid for 10 minutes.\n\n${resetUrl}\n\nIf you didn't forget your password, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your PeerPrep Password Reset Token (Valid for 10 min)',
      message,
    });
    res.json({ message: 'A reset link has been sent to your email.' });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).send('There was an error sending the email. Please try again later.');
  }
};

exports.resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+passwordHistory');

  if (!user) {
    return res.status(400).json({ message: 'Token is invalid or has expired' });
  }

  if (await user.isPasswordReused(newPassword)) {
    return res.status(400).json({ message: 'You cannot reuse an old password.' });
  }
  
  user.passwordHistory.push(user.password);
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ message: 'Password has been reset successfully.' });
};