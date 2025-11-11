// AI Assistance Disclosure:
// Tool: Google Gemini AI (Model: PRO) date: 2025-10-31
// Scope: Generated implementation based on my API requirements.
// Author review: Validated correctness.

const User = require('../../models/User'); 
const sendEmail = require('../../utils/sendEmail');

const resendVerificationOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: 'If a user with that email exists, a new OTP has been sent.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'This account is already verified. Please log in.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save({ validateBeforeSave: false });

    const message = `Here is your new verification code: ${otp}\n\nThis code is valid for 15 minutes.`;
    
    await sendEmail({
      email: user.email,
      subject: 'Your New PeerPrep Email Verification Code',
      message,
    });

    res.json({ message: 'A new verification code has been sent to your email.' });

  } catch (err) {
    console.error('Error in resendVerificationOtp:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = resendVerificationOtp;