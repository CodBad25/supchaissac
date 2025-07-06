import { Router } from 'express';
import { z } from 'zod';

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

authRouter.post('/login', (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  // TODO: Authenticate user
  res.json({ token: 'fake-jwt-token' });
});
