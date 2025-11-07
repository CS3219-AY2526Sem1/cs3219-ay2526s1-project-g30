import schedule from "node-schedule";
import { recalcQuestionStats } from "./updateQuestionStats.js";

/**
 * Schedules nightly stats resync
 * Runs every day at 3:00 AM server time
 */
export function startNightlyResync() {
    // "0 3 * * *" → At 03:00 every day
    const job = schedule.scheduleJob("0 3 * * *", async () => {
        console.log("LOG | Nightly stats resync started...");
        try {
            await recalcQuestionStats();
            console.log("LOG | Nightly stats resync complete");
        } catch (err) {
            console.error("ERROR | Nightly resync failed:", err);
        }
    });

    console.log("LOG | Nightly resync job scheduled (03:00 daily)");
    return job;
}
