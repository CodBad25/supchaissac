import { Router } from 'express'
import passport from 'passport'
import { db } from '../../src/lib/db'
import { users } from '../../src/lib/schema'
import { eq } from 'drizzle-orm'

const router = Router()

// Route de connexion
router.post('/login', (req, res, next) => {
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

export default router
