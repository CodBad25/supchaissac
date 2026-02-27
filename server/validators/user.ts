import { z } from 'zod';

// Schéma de validation pour PATCH /api/admin/users/:id
// .strict() rejette tout champ non listé (empêche l'injection de champs arbitraires)
export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  civilite: z.enum(['M.', 'Mme']).optional().nullable(),
  subject: z.string().max(100).optional().nullable(),
  role: z.enum(['TEACHER', 'SECRETARY', 'PRINCIPAL', 'ADMIN']).optional(),
  inPacte: z.boolean().optional(),
  initials: z.string().max(4).optional().nullable(),
  pacteHoursTarget: z.number().int().min(0).optional(),
  pacteHoursDF: z.number().int().min(0).optional(),
  pacteHoursRCD: z.number().int().min(0).optional(),
  pacteHoursCompleted: z.number().int().min(0).optional(),
  pacteHoursCompletedDF: z.number().int().min(0).optional(),
  pacteHoursCompletedRCD: z.number().int().min(0).optional(),
  isActivated: z.boolean().optional(),
  signature: z.string().max(200).optional().nullable(),
}).strict();
