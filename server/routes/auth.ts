import { Router } from 'express'
import passport from 'passport'
import bcrypt from 'bcrypt'
import rateLimit from 'express-rate-limit'
import { db } from '../../src/lib/db'
import { users } from '../../src/lib/schema'
import { eq, and, gt } from 'drizzle-orm'
import { validatePassword } from '../validators/password'
import { BCRYPT_ROUNDS } from '../utils/constants'

const router = Router()

// Rate limiting pour protéger contre les attaques brute-force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives maximum
  message: { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Route de connexion (avec rate limiting)
router.post('/login', loginLimiter, (req, res, next) => {
  console.log(`🔐 [API] Tentative de connexion: ${req.body.username}`)
  
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      console.error('❌ [API] Erreur authentification:', err)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
    
    if (!user) {
      console.log('❌ [API] Échec authentification:', req.body.username)
      return res.status(401).json({ error: 'Identifiants incorrects' })
    }
    
    req.logIn(user, (err) => {
      if (err) {
        console.error('❌ [API] Erreur session:', err)
        return res.status(500).json({ error: 'Erreur de session' })
      }
      
      console.log(`✅ [API] Connexion réussie: ${user.name} (${user.role})`)

      // Parser le nom complet pour extraire prénom et nom
      const nameParts = user.name?.split(' ') || ['', '']
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      res.json({
        id: user.id,
        email: user.username,
        firstName: firstName,
        lastName: lastName,
        civilite: user.civilite,
        subject: user.subject,
        role: user.role,
        inPacte: user.inPacte || false,
        pacteHoursTarget: user.pacteHoursTarget || 0,
        pacteHoursCompleted: user.pacteHoursCompleted || 0,
        pacteHoursDF: user.pacteHoursDF || 0,
        pacteHoursRCD: user.pacteHoursRCD || 0,
        pacteHoursCompletedDF: user.pacteHoursCompletedDF || 0,
        pacteHoursCompletedRCD: user.pacteHoursCompletedRCD || 0
      })
    })
  })(req, res, next)
})

// Route de déconnexion
router.post('/logout', (req, res) => {
  const username = req.user?.username || 'Utilisateur inconnu'
  
  req.logout((err) => {
    if (err) {
      console.error('❌ [API] Erreur déconnexion:', err)
      return res.status(500).json({ error: 'Erreur de déconnexion' })
    }
    
    console.log(`👋 [API] Déconnexion: ${username}`)
    res.json({ message: 'Déconnexion réussie' })
  })
})

// Route pour vérifier l'état de connexion
router.get('/me', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      console.log(`ℹ️ [API] Vérification statut: ${req.user?.name} (${req.user?.role})`)
      
      // Récupérer les données fraîches depuis la base de données
      const userData = await db.select().from(users).where(eq(users.id, req.user?.id)).limit(1)
      
      if (userData.length === 0) {
        return res.status(404).json({ error: 'Utilisateur non trouvé' })
      }
      
      const user = userData[0]

      // Parser le nom complet pour extraire prénom et nom
      const nameParts = user.name?.split(' ') || ['', '']
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      res.json({
        id: user.id,
        email: user.username,
        firstName: firstName,
        lastName: lastName,
        civilite: user.civilite,
        subject: user.subject,
        role: user.role,
        inPacte: user.inPacte || false,
        pacteHoursTarget: user.pacteHoursTarget || 0,
        pacteHoursCompleted: user.pacteHoursCompleted || 0,
        pacteHoursDF: user.pacteHoursDF || 0,
        pacteHoursRCD: user.pacteHoursRCD || 0,
        pacteHoursCompletedDF: user.pacteHoursCompletedDF || 0,
        pacteHoursCompletedRCD: user.pacteHoursCompletedRCD || 0
      })
    } catch (error) {
      console.error('❌ [API] Erreur récupération utilisateur:', error)
      res.status(500).json({ error: 'Erreur serveur' })
    }
  } else {
    console.log('ℹ️ [API] Vérification statut: Non connecté')
    res.status(401).json({ error: 'Non connecté' })
  }
})

// Route pour modifier le profil
router.patch('/profile', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Non connecté' });
  }

  try {
    const { firstName, currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // Récupérer l'utilisateur actuel
    const userData = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userData.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = userData[0];
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    // Mise à jour du prénom d'usage
    if (firstName !== undefined) {
      // Reconstruire le nom complet avec le nouveau prénom
      const nameParts = user.name?.split(' ') || ['', ''];
      const lastName = nameParts.slice(1).join(' ') || '';
      updateData.name = firstName + (lastName ? ' ' + lastName : '');
    }

    // Mise à jour du mot de passe (optionnel)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Mot de passe actuel requis' });
      }

      // Vérifier le mot de passe actuel
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
      }

      const pwdCheck = validatePassword(newPassword);
      if (!pwdCheck.valid) {
        return res.status(400).json({ error: pwdCheck.error });
      }

      updateData.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    }

    // Appliquer les modifications
    await db.update(users).set(updateData).where(eq(users.id, userId));

    console.log(`✅ [API] Profil mis à jour: ${user.name}`);

    res.json({ success: true, message: 'Profil mis à jour' });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer la liste des utilisateurs de démo (page de connexion)
// Désactivée en production pour ne pas exposer les données utilisateurs
router.get('/users-list', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Route non disponible en production' });
  }

  try {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        role: users.role,
        inPacte: users.inPacte,
        civilite: users.civilite,
      })
      .from(users)
      .orderBy(users.role, users.name);

    // Filtrer: seulement comptes démo (@example.com)
    const filteredUsers = allUsers.filter(u =>
      u.username.endsWith('@example.com')
    );

    res.json(filteredUsers);
  } catch (error) {
    console.error('❌ [API] Erreur récupération users-list:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de test (à supprimer en production)
router.get('/status', (req, res) => {
  res.json({
    message: 'API Auth opérationnelle',
    timestamp: new Date().toISOString(),
    authenticated: req.isAuthenticated(),
    user: req.user ? {
      name: req.user.name,
      role: req.user.role
    } : null
  })
})

// Rate limiting pour les routes d'activation
const activationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Vérifier un token d'activation
router.get('/verify-token/:token', activationLimiter, async (req, res) => {
  try {
    const { token } = req.params;

    const userData = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        isActivated: users.isActivated,
        activationTokenExpiry: users.activationTokenExpiry,
      })
      .from(users)
      .where(eq(users.activationToken, token))
      .limit(1);

    if (userData.length === 0) {
      return res.status(404).json({ error: 'Token invalide ou expiré' });
    }

    const user = userData[0];

    // Vérifier si déjà activé
    if (user.isActivated) {
      return res.status(400).json({ error: 'Ce compte est déjà activé' });
    }

    // Vérifier l'expiration
    if (user.activationTokenExpiry && new Date() > user.activationTokenExpiry) {
      return res.status(400).json({ error: 'Ce lien a expiré. Contactez l\'administrateur.' });
    }

    res.json({
      valid: true,
      name: user.name,
      email: user.username,
    });
  } catch (error) {
    console.error('❌ [API] Erreur vérification token:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Activer un compte avec le token
router.post('/activate', activationLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token et mot de passe requis' });
    }

    const pwdCheck = validatePassword(password);
    if (!pwdCheck.valid) {
      return res.status(400).json({ error: pwdCheck.error });
    }

    // Trouver l'utilisateur avec ce token
    const userData = await db
      .select()
      .from(users)
      .where(eq(users.activationToken, token))
      .limit(1);

    if (userData.length === 0) {
      return res.status(404).json({ error: 'Token invalide' });
    }

    const user = userData[0];

    // Vérifier si déjà activé
    if (user.isActivated) {
      return res.status(400).json({ error: 'Ce compte est déjà activé. Connectez-vous.' });
    }

    // Vérifier l'expiration
    if (user.activationTokenExpiry && new Date() > user.activationTokenExpiry) {
      return res.status(400).json({ error: 'Ce lien a expiré. Contactez l\'administrateur.' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Activer le compte
    await db
      .update(users)
      .set({
        password: hashedPassword,
        isActivated: true,
        activationToken: null,
        activationTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    console.log(`✅ [AUTH] Compte activé: ${user.name} (${user.username})`);

    res.json({
      success: true,
      message: 'Compte activé avec succès. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    console.error('❌ [API] Erreur activation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router
