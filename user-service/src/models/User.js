const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8, select: false },
  passwordHistory: { type: [String], select: false},
  passwordResetToken: String,
  passwordResetExpires: Date,
  gender: {type : String, required: false},
  aboutMeInformation: { type: String, required: false },
  skillLevel: { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  preferredTopics: [String],
}, {
  timestamps: true
});

// This pre-save hook for hashing new passwords remains the same
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Helper method to check for reused passwords
userSchema.methods.isPasswordReused = async function(newPassword) {
  for (const oldPasswordHash of this.passwordHistory) {
    const isMatch = await bcrypt.compare(newPassword, oldPasswordHash);
    if (isMatch) return true; // Password was reused
  }
  return false; // Password is new
};

module.exports = mongoose.model('User', userSchema);