import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { setupAuth } from './services/auth'
import authRoutes from './routes/auth'
import sessionsRoutes from './routes/sessions'
import attachmentsRoutes from './routes/attachments'
import pacteRoutes from './routes/pacte'
import quotasRoutes from './routes/quotas'
import adminRoutes from './routes/admin'
import studentsRoutes from './routes/students'
import { testConnection } from '../src/lib/db'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const isProduction = process.env.NODE_ENV === 'production'

// Trust proxy (nécessaire pour les cookies sécurisés derrière Scaleway/load balancer)
if (isProduction) {
  app.set('trust proxy', 1)
  console.log('🔒 [SERVER] Trust proxy activé pour production')
}

// Configuration CORS - Support localhost, réseau local et production
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // En production, pas besoin de CORS (même domaine)
  // En dev, accepte localhost et réseau local
  const isAllowed = origin && (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.startsWith('http://192.168.') ||
    origin.startsWith('http://10.') ||
    origin.startsWith('http://172.') ||
    origin.includes('supchaissac') ||
    origin.includes('scw.cloud')
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
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

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
      "img-src 'self' data: https://s3.fr-par.scw.cloud",
      "connect-src 'self' https://s3.fr-par.scw.cloud",
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
      console.log(`🌐 [API] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`)
    })
  }
  next()
})

async function startServer() {
  try {
    // Test de connexion base de données
    console.log('🔧 Test de connexion PostgreSQL...')
    await testConnection()
    
    // Configuration authentification
    setupAuth(app)
    
    // Routes API
    app.use('/api/auth', authRoutes)
    app.use('/api/sessions', sessionsRoutes)
    app.use('/api/attachments', attachmentsRoutes)
    app.use('/api/pacte', pacteRoutes)
    app.use('/api/quotas', quotasRoutes)
    app.use('/api/admin', adminRoutes)
    app.use('/api/students', studentsRoutes)

    // Route de santé
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: 'PostgreSQL Neon',
        version: '2.0.0'
      })
    })

    // En production: servir le frontend React
    if (isProduction) {
      const distPath = path.join(__dirname, '..', 'dist')

      // Servir les fichiers statiques
      app.use(express.static(distPath))

      // SPA fallback: toutes les routes non-API renvoient index.html
      app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
          res.sendFile(path.join(distPath, 'index.html'))
        }
      })

      console.log(`📦 [SERVER] Mode production - Frontend servi depuis ${distPath}`)
    }

    // Gestionnaire d'erreurs global (DOIT être après toutes les routes)
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('❌ [ERROR]', err.stack)

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
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 [SERVER] SupChaissac v2.0 démarré sur le port ${PORT}`)
      console.log(`🌐 [SERVER] Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPPEMENT'}`)
      console.log(`🌐 [SERVER] API disponible sur:`)
      console.log(`   - http://localhost:${PORT}/api`)
      if (!isProduction) {
        console.log(`   - http://192.168.1.6:${PORT}/api (réseau local)`)
        console.log(`🔐 [SERVER] Comptes de test disponibles:`)
        console.log(`   👨‍🏫 teacher1@example.com / password123`)
        console.log(`   📝 secretary@example.com / password123`)
        console.log(`   🏛️ principal@example.com / password123`)
        console.log(`   ⚙️ admin@example.com / password123`)
      }
    })
    
  } catch (error) {
    console.error('💥 [SERVER] Erreur fatale au démarrage:', error)
    process.exit(1)
  }
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('💥 [SERVER] Exception non capturée:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [SERVER] Promesse rejetée non gérée:', reason)
  process.exit(1)
})

// Démarrage
startServer()
