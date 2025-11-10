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
