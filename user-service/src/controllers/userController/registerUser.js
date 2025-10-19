const User = require('../../models/User');
const crypto = require('crypto');
const sendEmail = require('../../utils/sendEmail');

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'A user with that email or username already exists.' });
    }
    
    const defaultProfilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff`;

    const user = await User.create({
      username,
      email,
      password,
      profilePictureUrl: defaultProfilePic,
    });

    const verificationToken = crypto.randomBytes(20).toString('hex');

    user.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    
    user.emailVerificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });

    const verificationUrl = `${req.protocol}://${req.get('host')}/api/users/verify-email/${verificationToken}`;
    const message = `Welcome to PeerPrep! Please click the following link to verify your email address. This link is valid for 24 hours.\n\n${verificationUrl}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Verify Your PeerPrep Email Address',
      message,
    });

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.'
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
};

module.exports = registerUser;