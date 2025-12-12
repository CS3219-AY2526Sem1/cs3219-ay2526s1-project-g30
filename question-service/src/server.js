// AI Assistance Disclosure:
// Tool: ChatGPT (model: GPT‑5 Thinking), date: 2025‑10-05
// Scope: Generated implementation.
// Author review: Validated and edited for testing support.

import dotenv from 'dotenv';
import connectDB from './config/db.js';
import mongoose from "mongoose";
import Question from "./models/question.model.js";
import { recalcQuestionStats } from "./utils/updateQuestionStats.js";
import { startNightlyResync } from "./utils/scheduler.js";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
    connectDB();

    // after connecting to MongoDB:
    mongoose.connection.once('open', async () => {
        console.log("LOG | MongoDB connected");

        // initialize stats once on startup
        await recalcQuestionStats();

        // Watch for changes in the Question collection
        const changeStream = Question.watch();
        changeStream.on('change', async (change) => {
            if (['insert', 'update', 'replace', 'delete'].includes(change.operationType)) {
                await recalcQuestionStats();
            }
        });

        console.log("LOG | Question stats watcher active");

        // Start the nightly backup sync
        startNightlyResync();
    });

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}