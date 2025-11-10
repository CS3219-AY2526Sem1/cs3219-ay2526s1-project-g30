const User = require('../../models/User');
const mongoose = require('mongoose'); 

const checkUserId = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid ID format.' });
  }

  try {
    const user = await User.findById(userId).select('username');

    if (user) {
      return res.status(200).json({ username: user.username });
    } else {
      return res.status(404).json({ message: 'User not found.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = checkUserId;