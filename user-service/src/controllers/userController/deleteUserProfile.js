// AI Assistance Disclosure:
// Tool: Google Gemini AI (Model: PRO) date: 2025-10-09
// Scope: Generated implementation based on my API requirements.
// Author review: Validated correctness.

const User = require('../../models/User');

const deleteUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      await user.deleteOne();
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

module.exports = deleteUserProfile;