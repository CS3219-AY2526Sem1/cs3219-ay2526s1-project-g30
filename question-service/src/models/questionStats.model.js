import mongoose from "mongoose";

const QuestionStatsSchema = new mongoose.Schema({
    _id: { type: String, default: "questionStats" },
    categories: [String],
    difficultyCounts: mongoose.Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("QuestionStats", QuestionStatsSchema);
