import Question from "../models/question.model.js";
import QuestionStats from "../models/questionStats.model.js";

export async function recalcQuestionStats() {
    // Aggregate all category-difficulty combinations
    const stats = await Question.aggregate([
        {
            $group: {
                _id: { category: "$category", difficulty: "$difficulty" },
                count: { $sum: 1 }
            }
        }
    ]);

    // Build formatted structures
    const categories = [...new Set(stats.map(s => s._id.category))];
    const difficultyCounts = {};
    for (const s of stats) {
        const { category, difficulty } = s._id;
        if (!difficultyCounts[category]) difficultyCounts[category] = {};
        difficultyCounts[category][difficulty] = s.count;
    }

    // update or insert single stats document
    await QuestionStats.updateOne(
        { _id: "questionStats" },
        { categories, difficultyCounts, updatedAt: new Date() },
        { upsert: true }
    );
}
