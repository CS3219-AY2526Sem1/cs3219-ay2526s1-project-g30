import axios from 'axios'
import express from 'express';
import Question from '../models/question.model.js';
import {generateFunctionTemplate} from "../utils/generateSignature.js";

const router = express.Router();

// get a random question by difficulty and category, avoid duplicates for user completed qns
router.get('/randomQuestion', async (req, res) => {
    try {
        const { difficulty, category, user1, user2 } = req.query;
        const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

        // fetch both users’ completed questions in parallel
        let completed1 = [];
        let completed2 = [];

        if (user1 || user2) {
            const [user1Data, user2Data] = await Promise.all([
                user1 ? axios.get(`${USER_SERVICE_URL}/${user1}`).catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
                user2 ? axios.get(`${USER_SERVICE_URL}/${user2}`).catch(() => ({ data: {} })) : Promise.resolve({ data: {} })
            ]);

            completed1 = user1Data.data.questionsCompleted || [];
            completed2 = user2Data.data.questionsCompleted || [];
        }

        const set1 = new Set(completed1);
        const set2 = new Set(completed2);
        const union = new Set([...set1, ...set2]);

        // build base filter (difficulty/category)
        const baseFilter = {};
        if (difficulty) baseFilter.difficulty = difficulty;
        if (category) baseFilter.category = category;

        // progressive selection
        let question = null;

        // Case 1: questions neither have completed
        let matchStage = { ...baseFilter, _id: { $nin: Array.from(union) } };
        let count = await Question.countDocuments(matchStage);
        if (count > 0) {
            const random = Math.floor(Math.random() * count);
            question = await Question.findOne(matchStage, { _id: 1 }).skip(random);
        }

        // Case 2: only user1 has completed all
        if (!question) {
            matchStage = { ...baseFilter, _id: { $nin: completed1 } };
            count = await Question.countDocuments(matchStage);
            if (count > 0) {
                const random = Math.floor(Math.random() * count);
                question = await Question.findOne(matchStage, { _id: 1 }).skip(random);
            }
        }

        // Case 3: only user2 has completed all
        if (!question) {
            matchStage = { ...baseFilter, _id: { $nin: completed2 } };
            count = await Question.countDocuments(matchStage);
            if (count > 0) {
                const random = Math.floor(Math.random() * count);
                question = await Question.findOne(matchStage, { _id: 1 }).skip(random);
            }
        }

        // Case 4: both have completed everything (fallback)
        if (!question) {
            count = await Question.countDocuments(baseFilter);
            if (count === 0) {
                return res.status(404).json({ message: 'No questions found at all' });
            }
            const random = Math.floor(Math.random() * count);
            question = await Question.findOne(baseFilter, { _id: 1 }).skip(random);
        }

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

// get the function signature and definitions
router.get('/:id/template', async (req, res) => {
    try {
        const { id } = req.params;
        const { lang } = req.query;

        if (!['python', 'java', 'cpp'].includes(lang)) {
            return res.status(400).json({ message: 'Unsupported language' });
        }

        const question = await Question.findById(id);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        const template = generateFunctionTemplate(question, lang);
        res.json(template);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// add a single question
router.post('/', async (req, res) => {
    try {
        const {title, description, difficulty, category, examples, function_name, function_params, function_return} = req.body;

        if (!title || !difficulty) {
            return res.status(400).json({message: 'Title and difficulty are required.'});
        }
        if (!function_name) {
            return res.status(400).json({message: 'Function name is required.'});
        }
        if (!function_params) {
            return res.status(400).json({message: 'Function parameters are required.'});
        }
        if (!function_return) {
            return res.status(400).json({message: 'Return type of function required.'});
        }
        if (!Array.isArray(function_params) || function_params.some(p =>
            !p.name || !p.langType || !p.langType.python || !p.langType.java || !p.langType.cpp
        )) {
            return res.status(400).json({ message: 'Each function parameter must have name and langType for python/java/cpp.' });
        }
        // do validation on function_return for each of the languages
        if (!function_return.python) {
            return res.status(400).json({message: 'Function return in python required.'});
        }
        if (!function_return.java) {
            return res.status(400).json({message: 'Function return in java required.'});
        }
        if (!function_return.cpp) {
            return res.status(400).json({message: 'Function return in cpp required.'});
        }

        const newQuestion = new Question({
            title,
            description,
            difficulty,
            category,
            examples,
            function_name,
            function_params,
            function_return
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
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedQuestion = await Question.findByIdAndDelete(id);
        if (!deletedQuestion) return res.status(404).json({ message: 'Question not found.' });
        res.status(200).json(deletedQuestion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;