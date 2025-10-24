import express from 'express';
import Question from '../models/question.model.js';

const router = express.Router();

// Get a random question by difficulty and category
router.get('/randomQuestion', async (req, res) => {
    try {
        const { difficulty, category } = req.query;

        // Build filter
        const matchStage = {};
        if (difficulty) matchStage.difficulty = difficulty;
        if (category) matchStage.category = category;

        // Aggregate pipeline with $match and $sample
        const [question] = await Question.aggregate([
            { $match: matchStage },
            { $sample: { size: 1 } }
        ]);

        if (!question) {
            return res.status(404).json({ message: 'No questions found' });
        }

        res.json(question);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});


router.post('/', async (req, res) => {
    try {
        const {title, description, difficulty, category, examples, function_name, function_params} = req.body;

        if (!title || !difficulty) {
            return res.status(400).json({message: 'Title and difficulty are required.'});
        }
        if (!function_params) {
            return res.status(400).json({message: 'Function parameters are required.'});
        }

        const newQuestion = new Question({
            title,
            description,
            difficulty,
            category,
            examples,
            function_name,
            function_params
        });

        const savedQuestion = await newQuestion.save();
        res.status(201).json(savedQuestion);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

export default router;