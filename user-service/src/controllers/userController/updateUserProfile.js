// AI Assistance Disclosure:
// Tool: Google Gemini AI (Model: PRO) date: 2025-10-09
// Scope: Generated implementation based on my API requirements.
// Author review: Validated correctness.

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
      if (req.body.displayName !== undefined) {
        user.displayName = req.body.displayName;
      }
      if (req.body.headline !== undefined) {
        user.headline = req.body.headline;
      }
      if (req.body.aboutMeInformation !== undefined) {
        user.aboutMeInformation = req.body.aboutMeInformation;
      }
      if (req.body.pronouns !== undefined) {
        user.pronouns = req.body.pronouns;
      }
      if (req.body.skillLevel !== undefined) {
        user.skillLevel = req.body.skillLevel;
      }
      if (req.body.preferredTopics !== undefined) {
        user.preferredTopics = req.body.preferredTopics;
      }
      if (req.body.socialLinks !== undefined) {
        user.socialLinks = req.body.socialLinks;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        gender: updatedUser.gender,
        displayName: updatedUser.displayName,
        headline: updatedUser.headline,
        aboutMeInformation: updatedUser.aboutMeInformation,
        pronouns: updatedUser.pronouns,
        skillLevel: updatedUser.skillLevel,
        preferredTopics: updatedUser.preferredTopics,
        profilePictureUrl: updatedUser.profilePictureUrl,
        socialLinks: updatedUser.socialLinks,
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