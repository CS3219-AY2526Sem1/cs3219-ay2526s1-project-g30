const User = require('../../models/User');

const uploadProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    user.profilePictureUrl = imageUrl;
    await user.save();

    res.json({
      message: 'Profile picture updated successfully',
      profilePictureUrl: user.profilePictureUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

module.exports = uploadProfilePicture;