import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { sql } from 'drizzle-orm'
import { setupAuth } from './services/auth'
import authRoutes from './routes/auth'
import sessionsRoutes from './routes/sessions'
import attachmentsRoutes from './routes/attachments'
import pacteRoutes from './routes/pacte'
import quotasRoutes from './routes/quotas'
import adminRoutes from './routes/admin'
import studentsRoutes from './routes/students'
import teachersRoutes from './routes/teachers'
import notificationsRoutes from './routes/notifications'
import { testConnection, db, closeDb } from '../src/lib/db'
import { logger } from './utils/logger'

// Définir le fuseau horaire
process.env.TZ = 'Europe/Paris'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'

// Trust proxy (nécessaire pour les cookies sécurisés derrière un reverse proxy/load balancer)
if (isProduction) {
  app.set('trust proxy', 1)
  logger.info('Trust proxy activé pour production')
}

// Configuration CORS - Whitelist explicite d'origines autorisées
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // En dev, accepter localhost et réseau local
  // En prod, uniquement les origines explicitement configurées via ALLOWED_ORIGINS
  const isAllowed = origin && (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    (!isProduction && (
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin.startsWith('http://172.')
    )) ||
    ALLOWED_ORIGINS.includes(origin)
  );

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  next()
})

// Middleware de base
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Limiteur de débit global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requêtes par fenêtre
  message: { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', globalLimiter)

// Headers de sécurité renforcés
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // Content Security Policy
  if (isProduction) {
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '))
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  next()
})

// Logs des requêtes API
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const start = Date.now()

    res.on('finish', () => {
      const duration = Date.now() - start
      logger.debug(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`, { method: req.method, path: req.path, statusCode: res.statusCode, durationMs: duration })
    })
  }
  next()
})

async function startServer() {
  try {
    // Test de connexion base de données
    logger.info('Test de connexion PostgreSQL...')
    await testConnection()
    
    // Configuration authentification
    setupAuth(app)
    
    // Servir les fichiers uploades
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

    // Routes API
    app.use('/api/auth', authRoutes)
    app.use('/api/sessions', sessionsRoutes)
    app.use('/api/attachments', attachmentsRoutes)
    app.use('/api/pacte', pacteRoutes)
    app.use('/api/quotas', quotasRoutes)
    app.use('/api/admin', adminRoutes)
    app.use('/api/students', studentsRoutes)
    app.use('/api/teachers', teachersRoutes)
    app.use('/api/notifications', notificationsRoutes)

    // Route de santé avec vérification BDD
    app.get('/api/health', async (req, res) => {
      try {
        await db.execute(sql`SELECT 1`)
        res.json({
          status: 'ok',
          timestamp: new Date().toISOString(),
          database: 'connected',
          version: '2.0.0'
        })
      } catch (error) {
        res.status(503).json({
          status: 'error',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          version: '2.0.0'
        })
      }
    })

    // En production: servir le frontend React
    if (isProduction) {
      const distPath = path.join(__dirname, '..', 'dist')

      // Servir les fichiers statiques
      app.use(express.static(distPath))

      // SPA fallback: toutes les routes non-API renvoient index.html
      app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
          res.sendFile(path.join(distPath, 'index.html'))
        }
      })

      logger.info(`Mode production - Frontend servi depuis ${distPath}`)
    }

    // Gestionnaire d'erreurs global (DOIT être après toutes les routes)
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Erreur non gérée', { stack: err.stack, message: err.message })

      // En production, masquer les détails de l'erreur
      if (isProduction) {
        res.status(500).json({
          error: 'Une erreur est survenue',
          message: 'Contactez l\'administrateur si le problème persiste'
        })
      } else {
        res.status(500).json({
          error: 'Erreur serveur',
          message: err.message,
          stack: err.stack
        })
      }
    })

    if (!isProduction) {
      // En dev: route de test
      app.get('/', (req, res) => {
        res.json({
          message: '🎓 SupChaissac v2.0 Backend',
          status: 'operational',
          endpoints: [
            'GET /api/health',
            'POST /api/auth/login',
            'POST /api/auth/logout',
            'GET /api/auth/me',
            'POST /api/sessions',
            'GET /api/sessions',
            'POST /api/attachments/upload/:sessionId',
            'DELETE /api/attachments/:id',
            'GET /api/attachments/session/:sessionId'
          ]
        })
      })
    }

    // Démarrage du serveur sur toutes les interfaces (0.0.0.0)
    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      logger.info(`SupChaissac v2.0 démarré sur le port ${PORT}`, { port: PORT })
      logger.info(`Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPPEMENT'}`, { environment: isProduction ? 'production' : 'development' })
      logger.info(`API disponible sur http://localhost:${PORT}/api`)
      if (!isProduction) {
        logger.info(`Mode développement - Comptes de test disponibles`, { testAccounts: ['sophie.martin@example.com', 'laure.martin@example.com', 'jean.dupont@example.com', 'admin@example.com'] })
      }
    })

    // Gestion de l'arrêt gracieux
    function gracefulShutdown(signal: string) {
      logger.info(`Signal ${signal} reçu. Arrêt gracieux...`, { signal })
      server.close(async () => {
        try {
          await closeDb()
          logger.info('Connexion BDD fermée')
        } catch (e) {
          logger.error('Erreur fermeture BDD', { error: e })
        }
        process.exit(0)
      })
      // Timeout de sécurité
      setTimeout(() => {
        logger.error('Timeout arrêt gracieux, forçage...')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    
  } catch (error) {
    logger.error('Erreur fatale au démarrage', { error })
    process.exit(1)
  }
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Exception non capturée', { error })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesse rejetée non gérée', { reason })
  // Ne pas exit brutalement, logger et laisser le graceful shutdown gérer
})

// Démarrage
startServer()
