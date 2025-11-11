const User = require('../../models/User');
const mongoose = require('mongoose'); 

const checkUserId = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ID format.' });
  }

  try {
    const user = await User.findById(id).select('username');

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