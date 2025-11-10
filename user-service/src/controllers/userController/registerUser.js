const User = require('../../models/User');
const sendEmail = require('../../utils/sendEmail');

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  
  let user;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'A user with that email or username already exists.' });
    }
    
    const defaultProfilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff`;

    user = await User.create({
      username,
      email,
      password,
      profilePictureUrl: defaultProfilePic,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpires = Date.now() + 15 * 60 * 1000; 
 
    await user.save({ validateBeforeSave: false });

    const message = `Welcome to PeerPrep! Your verification code is: ${otp}\n\nThis code is valid for 15 minutes. Please enter it in the application to verify your email address.`;
    
    await sendEmail({
      email: user.email,
      subject: 'Your PeerPrep Email Verification Code',
      message,
    });

    res.status(201).json({
      message: 'Registration successful! Please check your email for your verification code.',
      userId: user._id 
    });

  } catch (err) {
    console.error(err);

    if (user && user._id) {
      console.log('Cleaning up partially created user...');
      await User.deleteOne({ _id: user._id });
      return res.status(500).json({ message: 'Error sending verification email. Please try registering again.' });
    }
    
    if (err.code === 11000) {
        return res.status(400).json({ message: 'A user with that email or username already exists.' });
    }

    res.status(500).json({ message: 'Server Error during registration.' });
  }
};

module.exports = registerUser;