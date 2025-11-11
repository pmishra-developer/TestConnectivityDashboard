import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { emailRouter } from './routes/email';
import { databaseRouter } from './routes/database';
import { sessionMiddleware } from './middleware/session';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(sessionMiddleware);

app.use('/api/email', emailRouter);
app.use('/api/database', databaseRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
