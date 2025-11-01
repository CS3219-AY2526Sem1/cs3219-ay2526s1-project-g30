import mongoose from 'mongoose';

    const ReturnTypeSchema = new mongoose.Schema({
        python: { type: String, required: true },
        java: { type: String, required: true },
        cpp: { type: String, required: true }
    }, { _id: false });

    const ParamSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        langType: {
            python: { type: String, required: true },
            java: { type: String, required: true },
            cpp: { type: String, required: true }
        },
        // Optional: only for complex types like ListNode, TreeNode, GraphNode, etc.
        definition: {
            python: { type: String },
            java: { type: String },
            cpp: { type: String }
        }
    }, { _id: false });

    const QuestionSchema = new mongoose.Schema({
        title: {type: String, required: true},
        description: String,
        difficulty: {type: String, enum: ['easy', 'medium', 'hard'], required: true},
        category: [String],
        examples: [
            {
                input: { type: String },
                output: { type: String }
            }
        ],
        function_name: {
            type: String,
            required: true
        },
        function_params: {
            type: [ParamSchema],
            required: true
        },
        function_return: {
            type: ReturnTypeSchema,
            required: true
        }
    }, {timestamps: true});

export default mongoose.model('Question', QuestionSchema);