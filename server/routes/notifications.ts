import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getUnreadCount,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
} from '../services/notifications';
import { logger } from '../utils/logger';

const router = Router();

// Nombre de notifications non lues
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
    const count = await getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    logger.error('Erreur compteur notifications:', { error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liste paginée des notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const offset = parseInt(req.query.offset as string) || 0;

    const notifs = await getUserNotifications(req.user.id, limit, offset);
    res.json(notifs);
  } catch (error) {
    logger.error('Erreur liste notifications:', { error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Marquer une notification comme lue
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });

    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const success = await markAsRead(notificationId, req.user.id);
    if (!success) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Erreur marquer comme lue:', { error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Tout marquer comme lu
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });

    await markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Erreur tout marquer comme lu:', { error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les préférences email
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });

    const prefs = await getPreferences(req.user.id);
    res.json(prefs);
  } catch (error) {
    logger.error('Erreur récupération préférences:', { error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour les préférences email
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Non authentifié' });

    const { emailOnValidated, emailOnRejected, emailOnPaid } = req.body;

    await updatePreferences(req.user.id, {
      emailOnValidated: emailOnValidated === true,
      emailOnRejected: emailOnRejected === true,
      emailOnPaid: emailOnPaid === true,
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Erreur mise à jour préférences:', { error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
