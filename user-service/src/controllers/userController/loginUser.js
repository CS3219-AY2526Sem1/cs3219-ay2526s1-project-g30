// AI Assistance Disclosure:
// Tool: Google Gemini AI (Model: PRO) date: 2025-10-09
// Scope: Generated implementation based on my API requirements.
// Author review: Validated correctness.

const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email address before logging in.' });
    }

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        res.json({ 
          userId: user.id,
          token: token 
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

module.exports = loginUser;