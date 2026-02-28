import { z } from 'zod'

// Validation PACTE statut
export const pacteStatusSchema = z.object({
  inPacte: z.boolean(),
  pacteHoursTarget: z.number().int().min(0).optional(),
}).strict()

// Validation PACTE contrat
export const pacteContratSchema = z.object({
  inPacte: z.boolean().optional(),
  pacteHoursDF: z.number().int().min(0).optional(),
  pacteHoursRCD: z.number().int().min(0).optional(),
  pacteHoursCompletedDF: z.number().int().min(0).optional(),
  pacteHoursCompletedRCD: z.number().int().min(0).optional(),
  pacteHoursTarget: z.number().int().min(0).optional(),
  pacteHoursCompleted: z.number().int().min(0).optional(),
}).strict()

// Validation quotas
export const quotaUpdateSchema = z.object({
  quotas: z.array(z.object({
    type: z.enum(['HSE', 'DEVOIRS_FAITS', 'RCD']),
    budgetHours: z.number().int().min(0),
  })),
}).strict()

// Validation import CSV (format JSON)
export const importUsersSchema = z.object({
  users: z.array(z.object({
    login: z.string().optional(),
    civilite: z.string().optional(),
    nom: z.string().min(1),
    prenom: z.string().min(1),
    email: z.string().optional(),
    discipline: z.string().optional(),
    classes: z.string().optional(),
    statutPacte: z.string().optional(),
  })),
}).strict()
