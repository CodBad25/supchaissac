import { Router } from 'express';
import { db } from '../../src/lib/db';
import { hourQuotas, sessions } from '../../src/lib/schema';
import { requirePrincipal } from '../middleware/auth';
import { eq, and, gte, lte } from 'drizzle-orm';
import { quotaUpdateSchema } from '../validators';
import { logger } from '../utils/logger';

const router = Router();

// Helper pour obtenir l'annee scolaire courante (septembre a aout)
function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // L'annee scolaire commence en septembre (mois 8)
  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

// GET /api/quotas - Recuperer les quotas avec la consommation calculee
router.get('/', requirePrincipal, async (req, res) => {
  try {
    const schoolYear = getCurrentSchoolYear();

    // Recuperer les quotas existants
    const existingQuotas = await db
      .select()
      .from(hourQuotas)
      .where(eq(hourQuotas.schoolYear, schoolYear));

    // Calculer les dates de l'annee scolaire
    const [startYear] = schoolYear.split('-').map(Number);
    const schoolYearStart = `${startYear}-09-01`;
    const schoolYearEnd = `${startYear + 1}-08-31`;

    // Recuperer les sessions validees/payees de l'annee scolaire
    const allSessions = await db
      .select()
      .from(sessions)
      .where(
        and(
          gte(sessions.date, schoolYearStart),
          lte(sessions.date, schoolYearEnd)
        )
      );

    // Filtrer les sessions validees ou payees
    const validatedSessions = allSessions.filter(s =>
      s.status === 'VALIDATED' || s.status === 'SENT_FOR_PAYMENT'
    );

    // Calculer la consommation par type
    const consumption = {
      HSE: validatedSessions.filter(s => s.type === 'HSE').length,
      DEVOIRS_FAITS: validatedSessions.filter(s => s.type === 'DEVOIRS_FAITS').length,
      RCD: validatedSessions.filter(s => s.type === 'RCD').length,
    };

    // Construire la reponse avec quotas et consommation
    const quotasWithConsumption = ['HSE', 'DEVOIRS_FAITS', 'RCD'].map(type => {
      const quota = existingQuotas.find(q => q.type === type);
      return {
        type,
        budgetHours: quota?.budgetHours || 0,
        consumedHours: consumption[type as keyof typeof consumption],
        schoolYear,
        id: quota?.id || null,
      };
    });

    logger.debug(`Récupération quotas pour ${schoolYear}`, { schoolYear, quotasCount: quotasWithConsumption.length });
    res.json(quotasWithConsumption);
  } catch (error) {
    logger.error('Erreur récupération quotas', { error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /api/quotas - Mettre a jour les quotas (upsert)
router.put('/', requirePrincipal, async (req, res) => {
  try {
    const parseResult = quotaUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Données invalides', details: parseResult.error.errors });
    }

    const { quotas: quotaUpdates } = parseResult.data;
    const schoolYear = getCurrentSchoolYear();
    const userName = req.user?.name || 'Unknown';

    for (const update of quotaUpdates) {
      if (!update.type || typeof update.budgetHours !== 'number') {
        continue;
      }

      // Verifier si un quota existe deja
      const existing = await db
        .select()
        .from(hourQuotas)
        .where(
          and(
            eq(hourQuotas.type, update.type),
            eq(hourQuotas.schoolYear, schoolYear)
          )
        );

      if (existing.length > 0) {
        // Mise a jour
        await db
          .update(hourQuotas)
          .set({
            budgetHours: update.budgetHours,
            updatedAt: new Date(),
            updatedBy: userName,
          })
          .where(eq(hourQuotas.id, existing[0].id));

        logger.info(`Mise à jour quota ${update.type}: ${update.budgetHours}h par ${userName}`, { type: update.type, budgetHours: update.budgetHours, userName });
      } else {
        // Creation
        await db
          .insert(hourQuotas)
          .values({
            type: update.type,
            budgetHours: update.budgetHours,
            schoolYear,
            updatedBy: userName,
          });

        logger.info(`Création quota ${update.type}: ${update.budgetHours}h par ${userName}`, { type: update.type, budgetHours: update.budgetHours, userName });
      }
    }

    res.json({ success: true, message: 'Quotas mis à jour' });
  } catch (error) {
    logger.error('Erreur mise à jour quotas', { error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
