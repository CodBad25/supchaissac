// Vercel serverless function wrapper - Version ultra-simple
import postgres from 'postgres';

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
    // Health check avec test DB
    if (req.url === '/api/health') {
      let dbStatus = 'unknown';

      try {
        if (process.env.DATABASE_URL) {
          const sql = postgres(process.env.DATABASE_URL, { max: 1 });
          await sql`SELECT 1`;
          await sql.end();
          dbStatus = 'connected';
        }
      } catch (dbError) {
        dbStatus = 'error: ' + dbError.message;
      }

      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        auth_mode: process.env.AUTH_MODE || 'PRODUCTION',
        database: dbStatus,
        url: req.url
      });
      return;
    }

    // Pour les autres routes, retourner une erreur temporaire
    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'API routes are being configured',
      url: req.url,
      method: req.method
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
