import 'dotenv/config'
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Express } from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import bcrypt from 'bcrypt'
import { db } from '../../src/lib/db'
import { users } from '../../src/lib/schema'
import { eq } from 'drizzle-orm'

// Session store PostgreSQL
const PgSession = connectPgSimple(session)

// Types pour TypeScript
declare global {
  namespace Express {
    interface User {
      id: number
      username: string
      name: string
      role: 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN'
      initials: string | null
      inPacte: boolean
    }
  }
}

// Configuration authentification
export function setupAuth(app: Express) {
  console.log('🔐 Configuration de l\'authentification...')

  // Configuration des sessions avec PostgreSQL store
  const isProduction = process.env.NODE_ENV === 'production'

  // Vérification du secret de session (obligatoire en production)
  const sessionSecret = process.env.SESSION_SECRET
  if (isProduction && !sessionSecret) {
    throw new Error('SESSION_SECRET est requis en production')
  }
  if (!sessionSecret) {
    console.warn('⚠️ [AUTH] SESSION_SECRET non défini, utilisation d\'une clé de développement')
  }

  const sessionConfig: session.SessionOptions = {
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'user_sessions', // Nom de la table des sessions
      createTableIfMissing: true, // Crée automatiquement la table
    }),
    name: 'supchaissac.sid', // Nom explicite du cookie
    secret: sessionSecret || 'dev-only-secret-not-for-production-use',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      secure: isProduction, // HTTPS en production
      sameSite: 'lax', // 'lax' est plus compatible que 'strict'
      httpOnly: true,
      path: '/'
    }
  }

  console.log(`🍪 [AUTH] Cookie config: secure=${isProduction}, sameSite=lax`)

  console.log('📦 [AUTH] Session store: PostgreSQL (persistant)')

  app.use(session(sessionConfig))
  app.use(passport.initialize())
  app.use(passport.session())

  // Stratégie locale Passport
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password'
      },
      async (username, password, done) => {
        try {
          console.log(`🔐 [AUTH] Tentative de connexion: ${username}`)

          // Rechercher l'utilisateur
          const userResult = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1)

          if (userResult.length === 0) {
            console.log(`❌ [AUTH] Utilisateur non trouvé: ${username}`)
            return done(null, false)
          }

          const user = userResult[0]
          console.log(`👤 [AUTH] Utilisateur trouvé: ${user.name} (${user.role})`)

          // Vérifier le mot de passe
          const isPasswordValid = await bcrypt.compare(password, user.password)

          if (isPasswordValid) {
            console.log(`✅ [AUTH] Connexion réussie: ${user.name} (${user.role})`)
            
            // Retourner l'utilisateur sans le mot de passe
            const safeUser = {
              id: user.id,
              username: user.username,
              name: user.name,
              firstName: user.firstName,
              lastName: user.lastName,
              civilite: user.civilite,
              subject: user.subject,
              role: user.role,
              initials: user.initials,
              inPacte: user.inPacte
            }

            return done(null, safeUser)
          } else {
            console.log(`❌ [AUTH] Mot de passe incorrect: ${username}`)
            return done(null, false)
          }
        } catch (error) {
          console.error('❌ [AUTH] Erreur authentification:', error)
          return done(error)
        }
      }
    )
  )

  // Sérialisation utilisateur
  passport.serializeUser((user, done) => {
    console.log(`🔄 Sérialisation utilisateur: ${user.id} ${user.username}`)
    done(null, user.id)
  })

  // Désérialisation utilisateur
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`🔄 Désérialisation utilisateur ID: ${id}`)
      
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1)

      if (userResult.length === 0) {
        console.log(`❌ Utilisateur non trouvé pour ID: ${id}`)
        return done(null, false)
      }

      const user = userResult[0]
      const safeUser = {
        id: user.id,
        username: user.username,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        civilite: user.civilite,
        subject: user.subject,
        role: user.role,
        initials: user.initials,
        inPacte: user.inPacte
      }

      console.log(`✅ Utilisateur désérialisé: ${user.username}`)
      done(null, safeUser)
    } catch (error) {
      console.error('❌ Erreur désérialisation:', error)
      done(null, false)
    }
  })

  console.log('✅ Authentification configurée')
}
