#!/usr/bin/env node
/**
 * Servidor de Debug para identificar qual dependência está falhando
 * Útil quando server.js não inicia mas test-server.js funciona
 */

const PORT = process.env.PORT || 3000;

console.log('\n=== INICIANDO DEBUG SERVER ===\n');

// Teste 1: Express
try {
  console.log('1️⃣  Importando express...');
  const express = require('express');
  console.log('✅ Express importado com sucesso\n');

  // Teste 2: CORS
  try {
    console.log('2️⃣  Importando cors...');
    const cors = require('cors');
    console.log('✅ CORS importado com sucesso\n');

    // Teste 3: Multer
    try {
      console.log('3️⃣  Importando multer...');
      const multer = require('multer');
      console.log('✅ Multer importado com sucesso\n');

      // Teste 4: Supabase
      try {
        console.log('4️⃣  Importando @supabase/supabase-js...');
        const { createClient } = require('@supabase/supabase-js');
        console.log('✅ Supabase importado com sucesso\n');

        // Teste 5: PDF Parse
        try {
          console.log('5️⃣  Importando pdf-parse...');
          const pdfParse = require('pdf-parse');
          console.log('✅ PDF Parse importado com sucesso\n');

          // Se chegou aqui, todas as dependências estão OK
          console.log('🎉 TODAS AS DEPENDÊNCIAS FORAM IMPORTADAS COM SUCESSO!\n');

          // Agora testa se consegue iniciar o servidor
          const app = express();
          console.log('6️⃣  Criando aplicação Express...');
          console.log('✅ Aplicação Express criada\n');

          console.log('7️⃣  Configurando middleware...');
          app.use(cors({ origin: '*' }));
          console.log('✅ CORS configurado\n');

          console.log('8️⃣  Configurando health check...');
          app.get('/health', (req, res) => {
            res.json({ status: 'ok', timestamp: new Date().toISOString() });
          });
          console.log('✅ Health check configurado\n');

          console.log('9️⃣  Iniciando servidor...');
          const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Servidor iniciado na porta ${PORT}\n`);
            console.log('🚀 DEBUG SERVER PRONTO!\n');
            console.log(`📍 Teste: curl http://localhost:${PORT}/health\n`);
          });

          server.on('error', (error) => {
            console.error('\n❌ ERRO AO INICIAR SERVIDOR:', error.message);
            console.error('Tipo:', error.code);
            process.exit(1);
          });

        } catch (error) {
          console.error('\n❌ ERRO IMPORTANDO PDF-PARSE:');
          console.error('  Mensagem:', error.message);
          console.error('  Código:', error.code);
          process.exit(1);
        }
      } catch (error) {
        console.error('\n❌ ERRO IMPORTANDO SUPABASE:');
        console.error('  Mensagem:', error.message);
        console.error('  Código:', error.code);
        process.exit(1);
      }
    } catch (error) {
      console.error('\n❌ ERRO IMPORTANDO MULTER:');
      console.error('  Mensagem:', error.message);
      console.error('  Código:', error.code);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ERRO IMPORTANDO CORS:');
    console.error('  Mensagem:', error.message);
    console.error('  Código:', error.code);
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ ERRO IMPORTANDO EXPRESS:');
  console.error('  Mensagem:', error.message);
  console.error('  Código:', error.code);
  process.exit(1);
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('\n❌ ERRO NÃO CAPTURADO:');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ PROMISE REJEITADA:');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});
