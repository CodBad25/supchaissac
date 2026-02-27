import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, 'Au moins 8 caractères')
  .regex(/[A-Z]/, 'Au moins une majuscule')
  .regex(/[a-z]/, 'Au moins une minuscule')
  .regex(/[0-9]/, 'Au moins un chiffre');

export function validatePassword(password: string): { valid: boolean; error?: string } {
  const result = passwordSchema.safeParse(password);
  if (result.success) {
    return { valid: true };
  }
  if (!result.success && result.error?.issues && result.error.issues.length > 0) {
    return { valid: false, error: result.error.issues[0].message };
  }
  return { valid: false, error: 'Mot de passe invalide' };
}
