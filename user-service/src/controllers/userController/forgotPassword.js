// AI Assistance Disclosure:
// Tool: Google Gemini AI (Model: PRO) date: 2025-10-18
// Scope: Generated implementation based on my API requirements.
// Author review: Validated correctness.

const User = require('../../models/User'); 
const sendEmail = require('../../utils/sendEmail');

const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.json({ message: 'A verify link has been sent to your email.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.passwordResetOtp = otp;
    user.passwordResetOtpExpires = Date.now() + 15 * 60 * 1000;

    await user.save({ validateBeforeSave: false }); 

    const message = `You requested a password reset. Your One-Time Password (OTP) is: ${otp}\n\nThis code is valid for 15 minutes. Please enter it in the application to reset your password.\n\nIf you didn't request this, please ignore this email.`;

    await sendEmail({
      email: user.email,
      subject: 'Your PeerPrep Password Reset Code',
      message,
    });

    res.json({ message: 'An OTP has been sent to your email.' });

  } catch (err) {
    try {
        const userToClean = await User.findOne({ email: req.body.email });
        if (userToClean && userToClean.passwordResetOtp) {
            userToClean.passwordResetOtp = undefined;
            userToClean.passwordResetOtpExpires = undefined;
            await userToClean.save({ validateBeforeSave: false });
        }
    } catch (cleanupErr) {
        console.error('Error during OTP cleanup after email failure:', cleanupErr);
    }

    console.error('Error in forgotPassword:', err);
    res.status(500).json({ message: 'There was an error processing your request. Please try again later.'});
  }
};

module.exports = forgotPassword;