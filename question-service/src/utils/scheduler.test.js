import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// mock node-schedule and updateQuestionStats
vi.mock('node-schedule', () => {
    const scheduleJob = vi.fn();
    return {
        default: { scheduleJob },
        scheduleJob
    };
});

vi.mock('./updateQuestionStats.js', () => ({
    recalcQuestionStats: vi.fn()
}));

import { scheduleJob } from 'node-schedule';
import { recalcQuestionStats } from './updateQuestionStats.js';
import { startNightlyResync } from './scheduler.js';

describe('startNightlyResync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('schedules a job at 03:00 daily', () => {
        const jobMock = { someJobProp: true };
        scheduleJob.mockReturnValue(jobMock);

        const returnedJob = startNightlyResync();

        // check that scheduleJob is called with correct cron string
        expect(scheduleJob).toHaveBeenCalledTimes(1);
        const cronArg = scheduleJob.mock.calls[0][0];
        expect(cronArg).toBe('0 3 * * *');

        // check the returned job is the mock
        expect(returnedJob).toBe(jobMock);
    });

    it('runs callback and calls recalcQuestionStats', async () => {
        // capture the callback from scheduleJob
        let capturedCallback;
        scheduleJob.mockImplementation((cron, cb) => {
            capturedCallback = cb;
            return { scheduled: true };
        });

        recalcQuestionStats.mockResolvedValueOnce('done');

        startNightlyResync();

        await capturedCallback();

        // verify recalcQuestionStats was called
        expect(recalcQuestionStats).toHaveBeenCalledTimes(1);
        // optionally check that logs were called
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Nightly stats resync started'));
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Nightly stats resync complete'));
    });

    it('handles errors in recalcQuestionStats gracefully', async () => {
        let capturedCallback;
        scheduleJob.mockImplementation((cron, cb) => {
            capturedCallback = cb;
            return { scheduled: true };
        });

        const error = new Error('fail');
        recalcQuestionStats.mockRejectedValueOnce(error);

        startNightlyResync();

        await capturedCallback();

        // error should be logged
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Nightly resync failed:'), error);
    });
});
