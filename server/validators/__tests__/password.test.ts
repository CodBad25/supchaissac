import { describe, it, expect } from 'vitest';
import { validatePassword } from '../password';

describe('validatePassword', () => {
  it('rejette un mot de passe trop court', () => {
    const result = validatePassword('Ab1');
    expect(result.valid).toBe(false);
  });

  it('rejette un mot de passe sans majuscule', () => {
    const result = validatePassword('abcdefgh1');
    expect(result.valid).toBe(false);
  });

  it('rejette un mot de passe sans minuscule', () => {
    const result = validatePassword('ABCDEFGH1');
    expect(result.valid).toBe(false);
  });

  it('rejette un mot de passe sans chiffre', () => {
    const result = validatePassword('Abcdefghi');
    expect(result.valid).toBe(false);
  });

  it('accepte un mot de passe valide', () => {
    const result = validatePassword('Abcdefg1');
    expect(result.valid).toBe(true);
  });

  it('accepte un mot de passe complexe', () => {
    const result = validatePassword('MonSuperMotDePasse123!');
    expect(result.valid).toBe(true);
  });
});
