#!/usr/bin/env node
/**
 * Servidor mínimo de teste para diagnóstico
 * Útil para verificar se o Railway consegue iniciar algo
 */

const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }

  // 404 para outras rotas
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor de teste iniciado na porta ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health\n`);
});

server.on('error', (error) => {
  console.error('❌ Erro no servidor:', error);
  process.exit(1);
});
