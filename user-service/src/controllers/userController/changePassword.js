const User = require('../../models/User'); 
const bcrypt = require('bcryptjs');

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (currentPassword === newPassword) {
    return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
  }

  const user = await User.findById(req.user.id).select('+password +passwordHistory');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid current password' });
  }

  if (await user.isPasswordReused(newPassword)) {
    return res.status(400).json({ message: 'You cannot reuse an old password.' });
  }

  if (!user.passwordHistory.includes(user.password)) {
    user.passwordHistory.push(user.password);
  }

  if (user.passwordHistory.length > 5) {
    user.passwordHistory.shift();
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
};

module.exports = changePassword;