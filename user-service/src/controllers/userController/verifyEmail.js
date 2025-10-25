const User = require('../../models/User');
const crypto = require('crypto');

const verifyEmail = async (req, res) => {
  try {
    // 1. Hash the token from the URL the user clicked
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // 2. Find a user with that token that has not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpires: { $gt: Date.now() },
    });

    // 3. If no user is found, the token is invalid or has expired
    if (!user) {
      return res.status(400).send('<h1>Error</h1><p>Verification token is invalid or has expired.</p>');
    }

    // 4. Update the user's status to verified and clear the token fields
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    // In a real app, you would redirect to a "Success!" page on your frontend
    res.status(200).send('<h1>Success!</h1><p>Your email has been verified. You can now log in.</p>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

module.exports = verifyEmail;