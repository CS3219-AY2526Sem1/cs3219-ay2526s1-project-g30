import Question from "../models/question.model.js";
import QuestionStats from "../models/questionStats.model.js";

export async function recalcQuestionStats() {
    // Unwind category so each category value is treated separately, then group by category+difficulty
    const stats = await Question.aggregate([
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: false } },
        {
            $group: {
                _id: { category: "$category", difficulty: "$difficulty" },
                count: { $sum: 1 }
            }
        }
    ]);

    // Unique list of categories as strings
    const categories = Array.from(new Set(stats.map(s => String(s._id.category))));

    // Build difficultyCounts per category
    const difficultyCounts = {};
    for (const s of stats) {
        const { category, difficulty } = s._id;
        if (!difficultyCounts[category]) difficultyCounts[category] = {};
        difficultyCounts[category][difficulty] = s.count;
    }

    // Use $set to update fields (avoids replacement/casting issues) and upsert if missing
    await QuestionStats.updateOne(
        { _id: "questionStats" },
        { $set: { categories, difficultyCounts, updatedAt: new Date() } },
        { upsert: true }
    );
}