const User = require('../models/User');

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