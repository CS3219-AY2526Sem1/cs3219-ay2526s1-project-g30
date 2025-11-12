// AI Assistance Disclosure:
// Tool: ChatGPT (model: GPT‑5 Thinking), date: 2025‑10-05
// Scope: Generated implementation.
// originally generated as part of server.js, split out for modularity

import express from 'express';
import cors from 'cors';
import questionRoutes from './routes/question.routes.js';
import statsRoutes from './routes/stats.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/questions', questionRoutes);
app.use('/stats', statsRoutes);

export default app;
