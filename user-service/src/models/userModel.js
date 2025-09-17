const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  gender: {type : String, required: false},
  aboutMeInformation: { type: String, required: false },
  skillLevel: { type: String, enum: ['beginner','intermediate','advanced'], default: 'beginner' },
  preferredTopics: [String],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);