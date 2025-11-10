import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import connectDB from './db.js';

// Mock mongoose to prevent real DB connections
vi.mock('mongoose', () => ({
    default: {
        connect: vi.fn(),
    },
}));

describe('connectDB', () => {
    const originalExit = process.exit;
    const mockExit = vi.fn();

    beforeEach(() => {
        process.exit = mockExit;
        vi.clearAllMocks();
    });

    afterEach(() => {
        process.exit = originalExit;
    });

    it('should connect successfully with valid URI', async () => {
        mongoose.connect.mockResolvedValueOnce(true);
        process.env.MONGO_URI = 'mongodb://localhost:27017/testdb';

        await connectDB();

        expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
        expect(mockExit).not.toHaveBeenCalled();
    });

    it('should exit process on connection failure', async () => {
        mongoose.connect.mockRejectedValueOnce(new Error('Connection failed'));

        await connectDB();

        expect(mockExit).toHaveBeenCalledWith(1);
    });
});
