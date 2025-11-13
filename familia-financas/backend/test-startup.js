#!/usr/bin/env node

const http = require('http');
const PORT = process.env.PORT || 3000;

console.log(`[TEST] Node version: ${process.version}`);
console.log(`[TEST] PORT environment: ${process.env.PORT}`);
console.log(`[TEST] Attempting to listen on port: ${PORT}`);

const server = http.createServer((req, res) => {
  console.log(`[TEST] Received request: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ test: 'ok', timestamp: new Date().toISOString() }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[TEST] ✅ Server successfully listening on port ${PORT}`);
  console.log(`[TEST] Try: curl http://localhost:${PORT}/test`);
});

server.on('error', (error) => {
  console.error(`[TEST] ❌ Server error:`, error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log(`[TEST] SIGTERM received, shutting down`);
  process.exit(0);
});
