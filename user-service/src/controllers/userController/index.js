module.exports = {
  registerUser: require('./registerUser'),
  loginUser: require('./loginUser'),
  getUserProfile: require('./getUserProfile'),
  updateUserProfile: require('./updateUserProfile'),
  deleteUserProfile: require('./deleteUserProfile'),
  changePassword: require('./changePassword'),
  forgotPassword: require('./forgotPassword'),
  resetPassword: require('./resetPassword'),
  uploadProfilePicture: require('./uploadProfilePicture'),
  addCompletedQuestion: require('./addCompletedQuestion'),
  verifyOtp: require('./verifyOtp'),
  resendVerificationOtp: require('./resendVerificationOtp'),
  checkUsername: require('./checkUsername'),
  checkUserId: require('./checkUserId')
}; 