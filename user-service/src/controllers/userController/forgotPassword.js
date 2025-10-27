const User = require('../../models/User'); 
const crypto = require('crypto');
const sendEmail = require('../../utils/sendEmail');

const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.json({ message: 'A reset link has been sent to your email.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`;
    const message = `Forgot your password? Please click the link below to set a new one. This link is valid for 30 minutes.\n\n${resetUrl}\n\nIf you didn't forget your password, please ignore this email.`;

    await sendEmail({
      email: user.email,
      subject: 'Your PeerPrep Password Reset Link (Valid for 30 min)',
      message,
    });

    res.json({ message: 'A reset link has been sent to your email.' });

  } catch (err) {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
    }
    
    console.error(err);
    res.status(500).send('There was an error sending the email. Please try again later.');
  }
};

module.exports = forgotPassword;