#!/usr/bin/env node

const http = require('http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);

  // Health check endpoint for Railway load balancer
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: timestamp,
      uptime: process.uptime()
    }));
    return;
  }

  // PDF processing endpoint (placeholder)
  if (req.url === '/api/process-pdf' && req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'PDF processing placeholder',
      timestamp: timestamp
    }));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not found',
    path: req.url,
    method: req.method
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ✅ Server running on port ${PORT}`);
  console.log(`[${timestamp}] 🏥 Health check: GET /health`);
  console.log(`[${timestamp}] 📄 API: POST /api/process-pdf`);
});

server.on('error', (error) => {
  console.error('[ERROR] Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SIGTERM] Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('[SIGTERM] Server closed');
    process.exit(0);
  });
});
