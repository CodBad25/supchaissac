import { Router, Request, Response } from 'express';
import { storage } from '../storage/memory.storage';

const router = Router();

// GET /api/users - Liste tous les utilisateurs
router.get('/', async (req: Request, res: Response) => {
  const users = await storage.getAllUsers?.();
  res.json(users || []);
});

export default router;
