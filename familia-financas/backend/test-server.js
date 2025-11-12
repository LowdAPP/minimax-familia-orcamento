/**
 * Servidor de teste mínimo para verificar se inicia
 */

console.log('🔧 Teste: Iniciando servidor mínimo...');
console.log('📦 Node version:', process.version);
console.log('📁 Working directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 PORT:', process.env.PORT || 'não definido (usando 3000)');

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  console.log('✅ Health check chamado');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀🚀🚀 Servidor de teste iniciado na porta ${PORT}`);
  console.log(`✅ Servidor pronto!`);
});

server.on('error', (error) => {
  console.error('❌ Erro ao iniciar servidor:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recebido');
  server.close(() => {
    console.log('✅ Servidor encerrado');
    process.exit(0);
  });
});

