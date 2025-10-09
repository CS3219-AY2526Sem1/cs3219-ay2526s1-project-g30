const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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