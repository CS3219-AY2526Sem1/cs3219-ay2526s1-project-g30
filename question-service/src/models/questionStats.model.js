// AI Assistance Disclosure:
// Tool: ChatGPT (model: GPT‑5 Thinking), date: 2025‑11-08
// Scope: Generated implementation based on provided category tracking requirements.
// Author review: Validated correctness.

import mongoose from "mongoose";

const QuestionStatsSchema = new mongoose.Schema({
    _id: { type: String, default: "questionStats" },
    categories: [String],
    difficultyCounts: mongoose.Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model("QuestionStats", QuestionStatsSchema);
