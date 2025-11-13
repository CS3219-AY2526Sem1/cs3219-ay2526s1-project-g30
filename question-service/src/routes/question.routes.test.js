// AI Assistance Disclosure:
// Tool: ChatGPT (model: GPT‑5 Thinking), date: 2025‑11-10
// Scope: Generated implementation of unit testing.
// Author review: Validated and edited for correctness.

import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import Question from '../models/question.model.js';
import * as signatureUtil from "../utils/generateSignature.js";
import axios from 'axios';

vi.mock('axios');

const sampleQuestion = {
    title: 'Validate Parentheses',
    description: 'Check if parentheses are valid',
    difficulty: 'easy',
    category: ['Stack', 'String'],
    examples: [
        { input: "s = '()[]{}'", output: 'true' },
        { input: "s = '(]'", output: 'false' }
    ],
    function_name: 'isValid',
    function_params: [
        {
            name: 's',
            langType: {
                python: 'str',
                java: 'String',
                cpp: 'string'
            }
        }
    ],
    function_return: {
        python: 'bool',
        java: 'boolean',
        cpp: 'bool'
    }
};

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Question.deleteMany({});
});

describe('Question Routes', () => {
    it('should create a new question', async () => {
        const res = await request(app).post('/questions').send(sampleQuestion);
        expect(res.status).toBe(201);
        expect(res.body.title).toBe('Validate Parentheses');
    });

    it('should reject invalid question creation', async () => {
        const res = await request(app).post('/questions').send({
            title: 'Missing Function',
            difficulty: 'easy'
        });
        expect(res.status).toBe(400);
    });

    it('should fetch question by ID', async () => {
        const question = await Question.create(sampleQuestion);
        const res = await request(app).get(`/questions/${question._id}`);
        expect(res.status).toBe(200);
        expect(res.body._id).toBe(question._id.toString());
    });

    it('should return 404 for missing question', async () => {
        const id = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/questions/${id}`);
        expect(res.status).toBe(404);
    });

    it('should get function template by ID', async () => {
        const question = await Question.create(sampleQuestion);
        const mockTemplate = { code: 'def isValid(s): pass' };
        vi.spyOn(signatureUtil, 'generateFunctionTemplate').mockReturnValue(mockTemplate);

        const res = await request(app).get(`/questions/${question._id}/template?lang=python`);
        expect(res.status).toBe(200);
        expect(res.body.code).toBe('def isValid(s): pass');
    });

    it('should reject invalid template language', async () => {
        const question = await Question.create(sampleQuestion);
        const res = await request(app).get(`/questions/${question._id}/template?lang=go`);
        expect(res.status).toBe(400);
    });

    it('should batch insert multiple questions', async () => {
        const res = await request(app)
            .post('/questions/batch')
            .send([sampleQuestion, { ...sampleQuestion, title: 'Another Question' }]);
        expect(res.status).toBe(201);
        expect(res.body.insertedIds.length).toBe(2);
    });

    it('should edit a question by ID', async () => {
        const question = await Question.create(sampleQuestion);
        const res = await request(app)
            .patch(`/questions/edit/${question._id}`)
            .send({ title: 'Updated Title' });
        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Updated Title');
    });

    it('should delete a question by ID', async () => {
        const question = await Question.create(sampleQuestion);
        const res = await request(app).delete(`/questions/delete/${question._id}`);
        expect(res.status).toBe(200);
        const exists = await Question.findById(question._id);
        expect(exists).toBeNull();
    });

    it('should handle /randomQuestion correctly (mocked axios)', async () => {
        const q1 = await Question.create({ ...sampleQuestion, title: 'Q1' });
        const q2 = await Question.create({ ...sampleQuestion, title: 'Q2' });

        axios.get.mockResolvedValueOnce({ data: { questionsCompleted: [q1._id.toString()] } });
        axios.get.mockResolvedValueOnce({ data: { questionsCompleted: [] } });

        const res = await request(app)
            .get('/questions/randomQuestion')
            .query({ difficulty: 'easy', category: 'Stack', user1: 'u1', user2: 'u2' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
    });
});