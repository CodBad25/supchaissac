import { db } from '../../src/lib/db';
import { notifications, notificationPreferences, users } from '../../src/lib/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

// Types de notification
export type NotificationType =
  | 'session_validated'
  | 'session_rejected'
  | 'session_paid'
  | 'new_session_to_review'
  | 'session_ready_for_payment'
  | 'info_requested';

// Créer une notification
export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  sessionId?: number
): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      sessionId: sessionId ?? null,
    });

    logger.info(`Notification créée pour user ${userId}: ${type}`, { userId, type, sessionId });

    // Vérifier si un email doit être envoyé
    await sendEmailIfEnabled(userId, type, title, message);
  } catch (error) {
    logger.error('Erreur création notification:', { error, userId, type });
  }
}

// Envoyer un email si les préférences l'autorisent
async function sendEmailIfEnabled(
  userId: number,
  type: NotificationType,
  title: string,
  message: string
): Promise<void> {
  // Seuls certains types déclenchent un email
  const emailTypes: Record<string, string> = {
    session_validated: 'emailOnValidated',
    session_rejected: 'emailOnRejected',
    session_paid: 'emailOnPaid',
  };

  const prefField = emailTypes[type];
  if (!prefField) return; // Pas d'email pour ce type

  try {
    // Récupérer les préférences
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    // Vérifier si l'email est activé (utiliser les défauts si pas de préférences)
    let shouldSend = false;
    if (prefs) {
      shouldSend = prefs[prefField as keyof typeof prefs] as boolean;
    } else {
      // Défauts : seul emailOnRejected est true par défaut
      shouldSend = type === 'session_rejected';
    }

    if (shouldSend) {
      // Récupérer l'email de l'utilisateur
      const [user] = await db
        .select({ email: users.username, name: users.name })
        .from(users)
        .where(eq(users.id, userId));

      if (user) {
        logger.info(`Email de notification à envoyer à ${user.email}: ${title}`, { email: user.email, type });
        // TODO: Implémenter l'envoi réel avec Resend quand EMAIL_ENABLED=true
        // Pour l'instant on log seulement
      }
    }
  } catch (error) {
    logger.error('Erreur vérification préférences email:', { error, userId });
  }
}

// Compter les notifications non lues
export async function getUnreadCount(userId: number): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));

  return result?.count ?? 0;
}

// Récupérer les notifications d'un utilisateur (paginées)
export async function getUserNotifications(
  userId: number,
  limit: number = 20,
  offset: number = 0
) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);
}

// Marquer une notification comme lue
export async function markAsRead(notificationId: number, userId: number): Promise<boolean> {
  const result = await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ))
    .returning();

  return result.length > 0;
}

// Marquer toutes les notifications comme lues
export async function markAllAsRead(userId: number): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
}

// Récupérer les préférences de notification
export async function getPreferences(userId: number) {
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));

  // Retourner les défauts si pas de préférences
  return prefs || {
    emailOnValidated: false,
    emailOnRejected: true,
    emailOnPaid: false,
  };
}

// Mettre à jour les préférences (upsert)
export async function updatePreferences(
  userId: number,
  prefs: {
    emailOnValidated?: boolean;
    emailOnRejected?: boolean;
    emailOnPaid?: boolean;
  }
) {
  const existing = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));

  if (existing.length > 0) {
    await db
      .update(notificationPreferences)
      .set(prefs)
      .where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values({
      userId,
      emailOnValidated: prefs.emailOnValidated ?? false,
      emailOnRejected: prefs.emailOnRejected ?? true,
      emailOnPaid: prefs.emailOnPaid ?? false,
    });
  }
}

// Notifier tous les utilisateurs d'un rôle donné
export async function notifyByRole(
  role: string,
  type: NotificationType,
  title: string,
  message: string,
  sessionId?: number
): Promise<void> {
  try {
    const roleUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, role as any));

    for (const user of roleUsers) {
      await createNotification(user.id, type, title, message, sessionId);
    }
  } catch (error) {
    logger.error(`Erreur notification rôle ${role}:`, { error, role, type });
  }
}
