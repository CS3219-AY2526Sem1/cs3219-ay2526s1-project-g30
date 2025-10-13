import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  category: String,
  examples: [String],
  imageURL: String
}, { timestamps: true });

export default mongoose.model('Question', QuestionSchema);