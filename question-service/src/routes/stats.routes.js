import express from 'express';
import QuestionStats from '../models/questionStats.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const stats = await QuestionStats.findById("questionStats");
        if (!stats) {
            return res.status(404).json({ message: "No stats found yet." });
        }
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
