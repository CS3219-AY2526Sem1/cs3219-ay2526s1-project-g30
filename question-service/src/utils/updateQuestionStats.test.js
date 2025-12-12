// AI Assistance Disclosure:
// Tool: ChatGPT (model: GPT‑5 Thinking), date: 2025‑11-10
// Scope: Generated implementation of unit testing.
// Author review: Validated and edited for correctness.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { recalcQuestionStats } from './updateQuestionStats.js';
import Question from '../models/question.model.js';
import QuestionStats from '../models/questionStats.model.js';

vi.mock('../models/question.model.js', () => ({
    default: {
        aggregate: vi.fn()
    }
}));

vi.mock('../models/questionStats.model.js', () => ({
    default: {
        updateOne: vi.fn()
    }
}));

describe('recalcQuestionStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('aggregates questions and updates stats', async () => {
        // mock aggregation result
        const aggResult = [
            { _id: { category: 'Array', difficulty: 'easy' }, count: 2 },
            { _id: { category: 'Array', difficulty: 'medium' }, count: 1 },
            { _id: { category: 'String', difficulty: 'easy' }, count: 3 }
        ];
        Question.aggregate.mockResolvedValueOnce(aggResult);

        await recalcQuestionStats();

        // categories should be unique strings
        const expectedCategories = ['Array', 'String'];

        // difficulty counts per category
        const expectedDifficultyCounts = {
            Array: { easy: 2, medium: 1 },
            String: { easy: 3 }
        };

        expect(Question.aggregate).toHaveBeenCalledTimes(1);
        expect(Question.aggregate).toHaveBeenCalledWith([
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: false } },
            {
                $group: {
                    _id: { category: '$category', difficulty: '$difficulty' },
                    count: { $sum: 1 }
                }
            }
        ]);

        expect(QuestionStats.updateOne).toHaveBeenCalledTimes(1);
        const updateArg = QuestionStats.updateOne.mock.calls[0][1].$set;

        expect(updateArg.categories).toEqual(expectedCategories);
        expect(updateArg.difficultyCounts).toEqual(expectedDifficultyCounts);
        expect(updateArg.updatedAt).toBeInstanceOf(Date);
    });

    it('handles empty aggregation result', async () => {
        Question.aggregate.mockResolvedValueOnce([]);

        await recalcQuestionStats();

        expect(QuestionStats.updateOne).toHaveBeenCalledTimes(1);
        const updateArg = QuestionStats.updateOne.mock.calls[0][1].$set;
        expect(updateArg.categories).toEqual([]);
        expect(updateArg.difficultyCounts).toEqual({});
        expect(updateArg.updatedAt).toBeInstanceOf(Date);
    });
});
