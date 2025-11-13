// AI Assistance Disclosure:
// Tool: ChatGPT (model: GPT‑5 Thinking), date: 2025‑10-05
// Scope: Generated implementation.
// Author review: Validated correctness.

import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};

export default connectDB;
