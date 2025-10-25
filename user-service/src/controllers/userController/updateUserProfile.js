const User = require('../../models/User');

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      if (req.body.username !== undefined) {
        user.username = req.body.username;
      }
      if (req.body.email !== undefined) {
        user.email = req.body.email;
      }
      if (req.body.gender !== undefined) {
        user.gender = req.body.gender;
      }
      if (req.body.aboutMeInformation !== undefined) {
        user.aboutMeInformation = req.body.aboutMeInformation;
      }
      if (req.body.skillLevel !== undefined) {
        user.skillLevel = req.body.skillLevel;
      }
      if (req.body.preferredTopics !== undefined) {
        user.preferredTopics = req.body.preferredTopics;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        gender: updatedUser.gender,
        aboutMeInformation: updatedUser.aboutMeInformation,
        skillLevel: updatedUser.skillLevel,
        preferredTopics: updatedUser.preferredTopics,
        profilePictureUrl: updatedUser.profilePictureUrl,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

module.exports = updateUserProfile;