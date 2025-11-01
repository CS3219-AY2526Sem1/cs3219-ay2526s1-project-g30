const User = require('../../models/User');
const mongoose = require('mongoose');

const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username: username }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);

  } catch (err) {
    console.error("Error in getUserProfile:", err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = getUserProfile;