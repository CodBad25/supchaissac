import 'dotenv/config'
import express from 'express'
import { setupAuth } from './services/auth'
import authRoutes from './routes/auth'
import sessionsRoutes from './routes/sessions'
import attachmentsRoutes from './routes/attachments'
import { testConnection } from '../src/lib/db'

const app = express()
const PORT = process.env.PORT || 3001

// Configuration CORS - Support localhost + réseau local
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Accepte localhost et toutes les IPs du réseau local (192.168.x.x, 10.x.x.x, etc.)
  const isAllowed = origin && (
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:') ||
    origin.startsWith('http://192.168.') ||
    origin.startsWith('http://10.') ||
    origin.startsWith('http://172.')
  );

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
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

// Headers de sécurité
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
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
    
    // Route de santé
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: 'PostgreSQL Neon',
        version: '2.0.0'
      })
    })

    // Route de base pour tester
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
    
    // Démarrage du serveur sur toutes les interfaces (0.0.0.0)
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 [SERVER] SupChaissac v2.0 démarré sur le port ${PORT}`)
      console.log(`🌐 [SERVER] API disponible sur:`)
      console.log(`   - http://localhost:${PORT}/api`)
      console.log(`   - http://192.168.1.6:${PORT}/api (réseau local)`)
      console.log(`🔐 [SERVER] Comptes de test disponibles:`)
      console.log(`   👨‍🏫 teacher1@example.com / password123`)
      console.log(`   📝 secretary@example.com / password123`)
      console.log(`   🏛️ principal@example.com / password123`)
      console.log(`   ⚙️ admin@example.com / password123`)
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
