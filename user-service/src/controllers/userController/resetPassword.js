const User = require('../../models/User');

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
  }

  try {
    const user = await User.findOne({
      email: email,
    }).select('+passwordHistory'); 

    if (!user) {
      return res.status(400).json({ message: 'Invalid email or OTP.' });
    }
    if (user.passwordResetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid email or OTP.' });
    }
    if (user.passwordResetOtpExpires < Date.now()) {
      user.passwordResetOtp = undefined;
      user.passwordResetOtpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    user.password = newPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error during password reset.' });
  }
};

module.exports = resetPassword;