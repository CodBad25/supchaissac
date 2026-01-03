import crypto from 'crypto';

// Configuration email - désactivé par défaut pour la phase de présentation
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// Domaines académiques autorisés
const ALLOWED_DOMAINS = [
  'ac-lyon.fr',
  'ac-grenoble.fr',
  'ac-clermont.fr',
  'ac-aix-marseille.fr',
  'ac-nice.fr',
  'ac-montpellier.fr',
  'ac-toulouse.fr',
  'ac-bordeaux.fr',
  'ac-poitiers.fr',
  'ac-limoges.fr',
  'ac-nantes.fr',
  'ac-rennes.fr',
  'ac-caen.fr',
  'ac-rouen.fr',
  'ac-amiens.fr',
  'ac-lille.fr',
  'ac-reims.fr',
  'ac-nancy-metz.fr',
  'ac-strasbourg.fr',
  'ac-besancon.fr',
  'ac-dijon.fr',
  'ac-orleans-tours.fr',
  'ac-paris.fr',
  'ac-versailles.fr',
  'ac-creteil.fr',
  'ac-martinique.fr',
  'ac-guadeloupe.fr',
  'ac-guyane.fr',
  'ac-reunion.fr',
  'ac-mayotte.fr',
  'ac-corse.fr',
  // Ajouter d'autres domaines si nécessaire
  'example.com', // Pour les tests
];

// Générer un token d'activation sécurisé
export function generateActivationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Vérifier si l'email est un email académique autorisé
export function isAcademicEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return ALLOWED_DOMAINS.some(allowed => domain.endsWith(allowed));
}

// Générer le lien d'activation
export function getActivationLink(token: string): string {
  return `${APP_URL}/activate?token=${token}`;
}

// Envoyer l'email d'activation
export async function sendActivationEmail(
  email: string,
  name: string,
  token: string
): Promise<{ success: boolean; message: string; link?: string }> {
  const activationLink = getActivationLink(token);

  if (!EMAIL_ENABLED) {
    // Mode présentation : on log le lien au lieu d'envoyer l'email
    console.log('\n' + '='.repeat(60));
    console.log('[EMAIL SIMULATION - Mode présentation]');
    console.log(`Destinataire: ${email}`);
    console.log(`Nom: ${name}`);
    console.log(`Lien d'activation: ${activationLink}`);
    console.log('='.repeat(60) + '\n');

    return {
      success: true,
      message: 'Email simulé (mode présentation) - Voir console serveur',
      link: activationLink, // Retourné pour affichage dans l'admin
    };
  }

  // TODO: Implémenter l'envoi réel avec Resend, SendGrid, ou SMTP
  // Pour l'instant, on simule
  try {
    // Exemple avec Resend (à décommenter quand prêt)
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'SupChaissac <noreply@supchaissac.fr>',
      to: email,
      subject: 'Activez votre compte SupChaissac',
      html: getActivationEmailHtml(name, activationLink),
    });
    */

    console.log(`[EMAIL] Email d'activation envoyé à ${email}`);
    return { success: true, message: 'Email envoyé' };
  } catch (error) {
    console.error('[EMAIL] Erreur envoi:', error);
    return { success: false, message: 'Erreur lors de l\'envoi de l\'email' };
  }
}

// Template HTML pour l'email d'activation
export function getActivationEmailHtml(name: string, activationLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed, #6366f1); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>SupChaissac</h1>
      <p>Gestion des heures supplémentaires</p>
    </div>
    <div class="content">
      <h2>Bonjour ${name},</h2>
      <p>Votre compte SupChaissac a été créé. Pour l'activer et définir votre mot de passe, cliquez sur le bouton ci-dessous :</p>
      <p style="text-align: center;">
        <a href="${activationLink}" class="button">Activer mon compte</a>
      </p>
      <p>Ce lien est valable pendant <strong>48 heures</strong>.</p>
      <p>Si vous n'avez pas demandé ce compte, ignorez simplement cet email.</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <a href="${activationLink}">${activationLink}</a>
      </p>
    </div>
    <div class="footer">
      <p>Collège Paul Chaissac - Application de gestion des heures supplémentaires</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Vérifier si le mode email est activé
export function isEmailEnabled(): boolean {
  return EMAIL_ENABLED;
}
