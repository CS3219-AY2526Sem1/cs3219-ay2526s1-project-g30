// AI Assistance Disclosure:
// Tool: ChatGPT (model: GPT‑5 Thinking), date: 2025‑11-10
// Scope: Generated implementation of unit testing.
// Author review: Validated and edited for correctness.

import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js'; // assuming your express app is exported here
import QuestionStats from '../models/questionStats.model.js';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

beforeEach(async () => {
    await QuestionStats.deleteMany({});
});

describe('Stats Routes', () => {
    it('should return 404 if no stats exist', async () => {
        const res = await request(app).get('/stats');
        expect(res.status).toBe(404);
        expect(res.body.message).toBe('No stats found yet.');
    });

    it('should return stats if they exist', async () => {
        const mockStats = {
            _id: 'questionStats',
            categories: ['Array', 'String'],
            difficultyCounts: {
                Array: { easy: 2, medium: 1 },
                String: { easy: 3, hard: 1 }
            },
            updatedAt: new Date()
        };
        await QuestionStats.create(mockStats);

        const res = await request(app).get('/stats');
        expect(res.status).toBe(200);
        expect(res.body._id).toBe('questionStats');
        expect(res.body.categories).toContain('Array');
        expect(res.body.difficultyCounts.Array.easy).toBe(2);
    });
});
