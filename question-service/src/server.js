import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import questionRoutes from './routes/question.routes.js';
import statsRoutes from './routes/stats.routes.js';
import mongoose from "mongoose";
import Question from "./models/question.model.js";
import { recalcQuestionStats } from "./utils/updateQuestionStats.js";
import { startNightlyResync } from "./utils/scheduler.js";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/questions', questionRoutes);
app.use('/stats', statsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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