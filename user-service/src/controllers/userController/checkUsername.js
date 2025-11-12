const User = require('../../models/User');

const checkUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: 'Username is required in the request body.' });
    }

    const user = await User.findOne({ username: username });

    if (user) {
      res.json({ isAvailable: false, message: 'Username is already taken.' });
    } else {
      res.json({ isAvailable: true, message: 'Username is available.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = checkUsername;