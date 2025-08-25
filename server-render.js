const express = require('express');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    auth_mode: process.env.AUTH_MODE || 'PRODUCTION',
    database_url_set: !!process.env.DATABASE_URL,
    session_secret_set: !!process.env.SESSION_SECRET,
    platform: 'Render'
  });
});

app.get('/api/user', (req, res) => {
  res.json({
    message: 'User endpoint working on Render',
    authenticated: false,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/login', (req, res) => {
  res.json({
    message: 'Login endpoint working on Render',
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    url: req.originalUrl,
    method: req.method,
    available_routes: ['/api/health', '/api/user', '/api/login', '/'],
    platform: 'Render'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SupChaissac server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});
