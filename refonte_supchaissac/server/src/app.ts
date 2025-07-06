import express from 'express';
import cors from 'cors';
import { authRouter } from './features/auth/auth.router';
import { sessionsRouter } from './features/sessions/sessions.router';
import usersRouter from './features/users/users.router';

export const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});
