import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

// Middleware pour vérifier l'authentification
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next()
  }

  logger.warn('Accès non autorisé - utilisateur non connecté')
  res.status(401).json({ error: 'Authentification requise' })
}

// Middleware pour vérifier les rôles
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      logger.warn('Accès non autorisé - utilisateur non connecté')
      return res.status(401).json({ error: 'Authentification requise' })
    }

    const userRole = req.user?.role
    if (!userRole || !allowedRoles.includes(userRole)) {
      logger.warn(`Accès refusé - rôle ${userRole} non autorisé pour ${allowedRoles.join(', ')}`, { userRole, allowedRoles })
      return res.status(403).json({ error: 'Permissions insuffisantes' })
    }

    logger.debug(`Accès autorisé - ${req.user?.name} (${userRole})`, { userName: req.user?.name, userRole })
    next()
  }
}

// Middleware spécifiques par rôle
export const requireTeacher = requireRole('TEACHER')
export const requireSecretary = requireRole('SECRETARY', 'PRINCIPAL', 'ADMIN')
export const requirePrincipal = requireRole('PRINCIPAL', 'ADMIN')
export const requireAdmin = requireRole('ADMIN')

// Middleware pour les enseignants (accès à leurs propres données uniquement)
export function requireTeacherOwnership(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentification requise' })
  }

  const userId = req.user?.id
  const requestedTeacherId = parseInt(req.params.teacherId || req.body.teacherId || '0')

  // Admin et Principal peuvent accéder à tout
  if (req.user?.role === 'ADMIN' || req.user?.role === 'PRINCIPAL' || req.user?.role === 'SECRETARY') {
    return next()
  }

  // Enseignant ne peut accéder qu'à ses propres données
  if (req.user?.role === 'TEACHER' && userId === requestedTeacherId) {
    return next()
  }

  logger.warn(`Accès refusé - enseignant ${userId} tentant d'accéder aux données de ${requestedTeacherId}`, { userId, requestedTeacherId })
  res.status(403).json({ error: 'Accès autorisé uniquement à vos propres données' })
}
