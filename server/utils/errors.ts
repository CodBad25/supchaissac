import { Response } from 'express'
import { logger } from './logger'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorResponse(res: Response, error: unknown): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      ...(error.details ? { details: error.details } : {}),
    })
    return
  }

  logger.error('Erreur inattendue', { error })
  res.status(500).json({ error: 'Erreur serveur' })
}
