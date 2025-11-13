#!/usr/bin/env node

const http = require('http');
const querystring = require('querystring');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const PORT = process.env.PORT || 3000;

// Inicializar cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[INIT] Supabase client initialized');
} else {
  console.log('[INIT] Supabase credentials not configured - database saving disabled');
}

// Função para extrair transações do texto do PDF
function parseTransactions(text) {
  const transactions = [];

  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 20) continue;

    // Padrão 1: DD-MM-YYYY DD-MM-YYYY descrição valor EUR saldo EUR
    // Exemplo: "06-11-202506-11-2025Vercel Mkt Supabase-27,68 EUR-1.280,41 EUR"
    const datePattern1 = /(\d{2})-(\d{2})-(\d{4})/;
    const dateMatch = trimmed.match(datePattern1);

    if (!dateMatch) continue;

    // Procura por valores em EUR ou R$
    const valueMatch = trimmed.match(/([-]?\d+[.,]\d{2})\s*(EUR|R\$)/);
    if (!valueMatch) continue;

    // Extrai a descrição (entre primeira data e o valor)
    const dateStr = dateMatch[0];
    const dateIdx = trimmed.indexOf(dateStr);

    // Remove as duas datas do início (operação e data)
    let withoutDates = trimmed;
    let firstDateIdx = withoutDates.indexOf(dateStr);
    if (firstDateIdx !== -1) {
      withoutDates = withoutDates.substring(firstDateIdx + dateStr.length);
      // Remove segunda data se existir
      let secondDateMatch = withoutDates.match(datePattern1);
      if (secondDateMatch) {
        let secondDateIdx = withoutDates.indexOf(secondDateMatch[0]);
        withoutDates = withoutDates.substring(secondDateIdx + secondDateMatch[0].length);
      }
    }

    // Extrai descrição (tudo até o valor)
    let description = '';
    const valueIdx = withoutDates.search(/[-]?\d+[.,]\d{2}\s*EUR/);
    if (valueIdx !== -1) {
      description = withoutDates.substring(0, valueIdx).trim();
    }

    if (!description) continue;

    // Converte valor
    const valueStr = valueMatch[1];
    const value = Math.abs(parseFloat(valueStr.replace(/\./g, '').replace(',', '.')));

    if (!isNaN(value) && value > 0) {
      // Determina tipo (débito vs crédito)
      const isDebit = trimmed.substring(0, trimmed.indexOf(valueMatch[0])).match(/[-]/);

      transactions.push({
        date: `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`,
        description: description.substring(0, 100),
        amount: value,
        type: isDebit ? 'debit' : 'credit',
        currency: valueMatch[2],
        raw_line: trimmed.substring(0, 250)
      });
    }
  }

  return transactions;
}

// Função para processar arquivo multipart/form-data
async function parseMultipartFormData(req) {
  return new Promise((resolve, reject) => {
    let data = Buffer.alloc(0);

    req.on('data', chunk => {
      data = Buffer.concat([data, chunk]);
      // Limita tamanho a 50MB
      if (data.length > 50 * 1024 * 1024) {
        reject(new Error('File too large'));
      }
    });

    req.on('end', () => {
      resolve(data);
    });

    req.on('error', reject);
  });
}

// Função para extrair arquivo PDF do multipart
function extractPdfFromMultipart(buffer, boundaryStr) {
  try {
    const boundary = Buffer.from('--' + boundaryStr);
    const startMarker = Buffer.from('filename=');
    const pdfStart = buffer.indexOf(Buffer.from('\r\n\r\n'));

    if (pdfStart === -1) return null;

    // Procura pelo fim do boundary
    const nextBoundary = buffer.indexOf(boundary, pdfStart + 4);
    const pdfEnd = nextBoundary > -1 ? nextBoundary - 2 : buffer.length - 2;

    return buffer.slice(pdfStart + 4, pdfEnd);
  } catch (err) {
    return null;
  }
}

// Função para salvar transações no Supabase
async function saveTransactionsToSupabase(transactions) {
  if (!supabase) {
    console.log('[DB] Supabase not configured, skipping database save');
    return { success: false, reason: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactions);

    if (error) {
      console.error('[DB] Error saving to Supabase:', error);
      return { success: false, reason: error.message };
    }

    console.log(`[DB] Successfully saved ${transactions.length} transactions to Supabase`);
    return { success: true, saved: transactions.length };
  } catch (err) {
    console.error('[DB] Exception saving to Supabase:', err.message);
    return { success: false, reason: err.message };
  }
}

const server = http.createServer(async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Supabase validation endpoint
  if (req.url === '/health/supabase' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      supabaseConfigured: !!supabase,
      supabaseUrl: supabaseUrl ? '✓ Set' : '✗ Missing',
      supabaseKey: supabaseKey ? '✓ Set' : '✗ Missing',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // PDF processing endpoint - REAL IMPLEMENTATION
  if (req.url === '/api/process-pdf' && req.method === 'POST') {
    try {
      const contentType = req.headers['content-type'] || '';

      // Extrai boundary do content-type
      const boundaryMatch = contentType.match(/boundary=([^;]+)/);
      const boundary = boundaryMatch ? boundaryMatch[1] : null;

      // Lê o arquivo enviado
      const buffer = await parseMultipartFormData(req);

      let pdfBuffer = null;

      if (boundary) {
        // Extrai PDF do multipart form data
        pdfBuffer = extractPdfFromMultipart(buffer, boundary);
      } else if (buffer.length > 0) {
        // Se não tiver boundary, assume que é o PDF direto
        pdfBuffer = buffer;
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Arquivo PDF não encontrado',
          timestamp: timestamp
        }));
        return;
      }

      // Processa o PDF com pdf-parse
      console.log(`[${timestamp}] Processing PDF (${pdfBuffer.length} bytes)...`);

      const pdfData = await pdfParse(pdfBuffer);
      const text = pdfData.text;

      console.log(`[${timestamp}] PDF parsed: ${pdfData.numpages} pages, ${text.length} chars`);

      // Extrai transações do texto
      const transactions = parseTransactions(text);

      console.log(`[${timestamp}] Found ${transactions.length} transactions`);

      // Tenta salvar no banco de dados
      let dbResult = { success: false, reason: 'Not attempted' };
      if (supabase && transactions.length > 0) {
        dbResult = await saveTransactionsToSupabase(transactions);
      }

      // Retorna resultado
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'PDF processado com sucesso',
        transactionsFound: transactions.length,
        transactions: transactions.slice(0, 50), // Retorna primeiras 50
        pdfPages: pdfData.numpages,
        databaseSave: dbResult,
        timestamp: timestamp
      }));
      return;

    } catch (error) {
      console.error(`[${timestamp}] Error processing PDF:`, error.message);

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: timestamp
      }));
      return;
    }
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
  console.log(`[${timestamp}] 🚀 Ready to accept requests!`);
  console.log(`[${timestamp}] 📍 Environment PORT: ${process.env.PORT || 'not set'}`);
});

// Prevent premature exits
setInterval(() => {}, 1000);

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
