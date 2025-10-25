const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  // CRITICAL: Add these TLS options
  tls: true,
  tlsAllowInvalidCertificates: true, // Needed for Cloud Run
  retryWrites: true,
  retryReads: true,
});
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;