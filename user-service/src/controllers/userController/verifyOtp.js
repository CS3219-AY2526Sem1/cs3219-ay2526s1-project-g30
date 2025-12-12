// AI Assistance Disclosure:
// Tool: Google Gemini AI (Model: PRO) date: 2025-10-28
// Scope: Generated implementation based on my API requirements.
// Author review: Validated correctness.

const User = require('../../models/User');

const verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ message: 'User ID and OTP are required.' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ message: 'Invalid user or OTP.' }); 
    }
    if (user.emailVerificationOtp !== otp) {
      return res.status(400).json({ message: 'Invalid user or OTP.' }); 
    }
    if (user.emailVerificationOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please register again.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error during OTP verification.' });
  }
};

module.exports = verifyOtp;