// Vercel serverless function wrapper - Version minimale
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Health check simple
    if (req.url === '/api/health') {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        auth_mode: process.env.AUTH_MODE || 'PRODUCTION',
        database_url_set: !!process.env.DATABASE_URL,
        session_secret_set: !!process.env.SESSION_SECRET,
        url: req.url
      });
      return;
    }

    // Route de test pour les utilisateurs
    if (req.url === '/api/user' && req.method === 'GET') {
      res.status(200).json({
        message: 'User endpoint working',
        authenticated: false,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Route de test pour le login
    if (req.url === '/api/login' && req.method === 'POST') {
      res.status(200).json({
        message: 'Login endpoint working',
        body: req.body,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Pour les autres routes
    res.status(404).json({
      error: 'Route not found',
      url: req.url,
      method: req.method,
      available_routes: ['/api/health', '/api/user', '/api/login']
    });

  } catch (error) {
    console.error('Vercel handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
