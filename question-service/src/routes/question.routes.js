import express from 'express';
import Question from '../models/question.model.js';

const router = express.Router();

// get a random question by difficulty and category
router.get('/randomQuestion', async (req, res) => {
    try {
        const { difficulty, category } = req.query;

        const matchStage = {};
        if (difficulty) matchStage.difficulty = difficulty;
        if (category) matchStage.category = category;

        // Efficient random selection: count, random skip, project only _id
        const count = await Question.countDocuments(matchStage);
        if (count === 0) {
            return res.status(404).json({ message: 'No questions found' });
        }
        const random = Math.floor(Math.random() * count);
        const question = await Question.findOne(matchStage, { _id: 1 }).skip(random);
        res.json({ id: question._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});


// get a specific question by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const question = await Question.findById(id);
        if (!question) return res.status(404).json({ message: 'Question not found.' });
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// add a single question
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

// edit a single question by ID
router.patch('/edit/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedQuestion = await Question.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedQuestion) return res.status(404).json({ message: 'Question not found.' });

        res.json(updatedQuestion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// remove a single question by ID
router.post('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedQuestion = await Question.findByIdAndDelete(id);
        if (!deletedQuestion) return res.status(404).json({ message: 'Question not found.' });
        res.status(200).json(deletedQuestion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

export default router;