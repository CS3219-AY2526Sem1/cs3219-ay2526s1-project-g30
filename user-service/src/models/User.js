const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8, select: false },
  passwordHistory: { type: [String], select: false},
  passwordResetOtp: String,        
  passwordResetOtpExpires: Date,
  gender: { type: String, enum: ['Male', 'Female', 'Nil'], default: 'Nil'},
  aboutMeInformation: { type: String, required: false, default: ''},
  skillLevel: { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  preferredTopics: [String],
  questionsCompleted: { type: [String], default: []},
  profilePictureUrl: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationOtp: String,      
  emailVerificationOtpExpires: Date,
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordReused = async function(newPassword) {
  for (const oldPasswordHash of this.passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, oldPasswordHash);
    if (isMatch) return true;
  }
  return false; 
};

module.exports = mongoose.model('User', userSchema);