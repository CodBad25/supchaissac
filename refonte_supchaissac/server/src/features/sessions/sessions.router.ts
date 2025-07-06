import { Router } from 'express';

export const sessionsRouter = Router();

sessionsRouter.get('/', (_req, res) => {
  // TODO: Fetch sessions from DB
  res.json([]);
});
