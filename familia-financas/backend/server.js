/**
 * Backend para processar PDFs
 * Deploy no Railway
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse';

const app = express();
const PORT = process.env.PORT || 3000;

// HEALTH CHECK - PRIMEIRA COISA, ANTES DE QUALQUER OUTRO MIDDLEWARE
// Isso garante que funcione mesmo se houver problemas com outras inicializações
app.get('/health', (req, res) => {
  console.log('✅✅✅ Health check chamado - método:', req.method, 'path:', req.path);
  console.log('✅ Headers:', JSON.stringify(req.headers));
  
  const response = { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'pdf-processor-backend',
    version: '1.0.0'
  };
  
  console.log('✅ Enviando resposta:', JSON.stringify(response));
  
  res.status(200).json(response);
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware para debug (mas não para /health para evitar problemas)
app.use((req, res, next) => {
  if (req.path !== '/health') {
    console.log(`${req.method} ${req.path} - Content-Type: ${req.get('Content-Type') || 'none'}`);
  }
  next();
});

// Não usar express.json() globalmente para evitar problemas com FormData
// Aplicaremos apenas onde necessário

// Configurar multer para upload de arquivos
const upload = multer({ storage: multer.memoryStorage() });

// Cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Endpoint para processar PDF
app.post('/api/process-pdf', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { user_id, account_id } = req.body;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo PDF não foi enviado'
      });
    }

    if (!user_id || !account_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id e account_id são obrigatórios'
      });
    }

    if (file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        success: false,
        error: 'Arquivo deve ser um PDF válido'
      });
    }

    console.log(`📄 Processando PDF: ${file.originalname} (${file.size} bytes)`);

    // 1. Extrair texto do PDF
    const pdfText = await extractTextFromPDF(file.buffer);
    console.log(`✅ Texto extraído: ${pdfText.length} caracteres`);

    // 2. Parsear transações
    const transactions = parseTransactionsFromText(pdfText);
    console.log(`✅ ${transactions.length} transações encontradas`);

    if (transactions.length === 0) {
      return res.json({
        success: false,
        error: 'Nenhuma transação foi encontrada no PDF',
        transactionsInserted: 0
      });
    }

    // 3. Preparar transações para inserção
    const transactionsToInsert = transactions.map(t => ({
      user_id,
      account_id,
      description: t.description,
      merchant: t.merchant || t.description,
      amount: t.amount,
      transaction_type: t.amount >= 0 ? 'receita' : 'despesa',
      transaction_date: t.date,
      status: 'confirmed',
      source: 'pdf_import',
    }));

    // 4. Inserir no banco de dados
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select();

    if (error) {
      console.error('❌ Erro ao inserir transações:', error);
      return res.status(500).json({
        success: false,
        error: `Erro ao salvar transações: ${error.message}`,
        transactionsInserted: 0
      });
    }

    console.log(`✅ ${data?.length || 0} transações inseridas com sucesso`);

    res.json({
      success: true,
      transactionsInserted: data?.length || 0,
      message: `${data?.length} transações importadas com sucesso`,
      preview: transactions.slice(0, 5).map(t => ({
        date: t.date,
        description: t.description.substring(0, 50),
        amount: t.amount
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao processar PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao processar PDF',
      transactionsInserted: 0
    });
  }
});

// Função para extrair texto do PDF
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Erro ao extrair texto do PDF: ${error.message}`);
  }
}

// Função para parsear transações (mesma lógica do script local)
function parseTransactionsFromText(text) {
  const transactions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
  const amountPattern = /([\+\-])\s*(\d{1,10}(?:[.,]\d{3})*[.,]\d{2})\s*(?:EUR|€|R\$|\$|USD)?/gi;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;

    if (line.includes('DataTipoDescritivo') || line.includes('Saldo contabilístico')) continue;

    const dateStr = dateMatch[1];
    const date = parseDate(dateStr);
    if (!date) continue;

    let description = '';
    let amount = null;

    const lineAfterDate = line.substring(line.indexOf(dateStr) + dateStr.length).trim();
    const hasDescriptionInLine = lineAfterDate.length > 3 && !/^[\d\s\-EUR€R\$£\$USD]+$/.test(lineAfterDate);

    if (hasDescriptionInLine) {
      description = lineAfterDate;
      const amountMatches = [...line.matchAll(amountPattern)];
      if (amountMatches.length > 0) {
        const amountMatch = amountMatches[0];
        const sign = amountMatch[1] === '+' ? 1 : -1;
        const value = parseAmount(amountMatch[2]);
        amount = sign * Math.abs(value);
        description = description.replace(amountMatch[0], '').trim();
      } else if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const nextAmountMatches = [...nextLine.matchAll(amountPattern)];
        if (nextAmountMatches.length > 0) {
          const amountMatch = nextAmountMatches[0];
          const sign = amountMatch[1] === '+' ? 1 : -1;
          const value = parseAmount(amountMatch[2]);
          amount = sign * Math.abs(value);
        }
      }
    } else {
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        description = nextLine.trim();
        const nextAmountMatches = [...nextLine.matchAll(amountPattern)];
        if (nextAmountMatches.length > 0) {
          const amountMatch = nextAmountMatches[0];
          const sign = amountMatch[1] === '+' ? 1 : -1;
          const value = parseAmount(amountMatch[2]);
          amount = sign * Math.abs(value);
          description = description.replace(amountMatch[0], '').trim();
        } else if (i + 2 < lines.length) {
          const valueLine = lines[i + 2];
          const valueMatches = [...valueLine.matchAll(amountPattern)];
          if (valueMatches.length > 0) {
            const valueMatch = valueMatches[0];
            const sign = valueMatch[1] === '+' ? 1 : -1;
            const value = parseAmount(valueMatch[2]);
            amount = sign * Math.abs(value);
          }
        }
      }
    }

    description = description
      .replace(/\s+/g, ' ')
      .replace(/[|\t]/g, ' ')
      .replace(/(?:EUR|€|R\$|\$|USD)\d+[.,]\d+(?:EUR|€|R\$|\$|USD)?/g, '')
      .trim();

    if (!amount || isNaN(amount) || Math.abs(amount) < 0.01) continue;
    if (description.length < 3 || description.length > 150) continue;
    if (/^[\d\s\.\,\-\/\+€\$£EURR\$USD]+$/.test(description)) continue;

    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('disponível') || lowerDesc.includes('autorizado')) continue;
    if (lowerDesc.includes('movimentos') && lowerDesc.includes('conta')) continue;

    const isDuplicate = transactions.some(t =>
      t.date === date &&
      Math.abs(t.amount - amount) < 0.01 &&
      t.description === description
    );

    if (!isDuplicate) {
      transactions.push({
        date,
        description,
        amount,
        merchant: extractMerchant(description)
      });
    }
  }

  return transactions;
}

function parseDate(dateStr) {
  const normalized = dateStr.replace(/-/g, '/');
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(normalized)) {
    const parts = normalized.split('/');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    if (year.length === 2) {
      const yearNum = parseInt(year);
      year = yearNum > 50 ? `19${year}` : `20${year}`;
    }
    const isoDate = `${year}-${month}-${day}`;
    const testDate = new Date(isoDate);
    if (testDate.toString() === 'Invalid Date') return null;
    return isoDate;
  }
  return null;
}

function parseAmount(amountStr) {
  let cleaned = amountStr.replace(/\s/g, '').replace(/[EUR€R\$£USD]/gi, '');
  const isNegative = cleaned.startsWith('-') || cleaned.includes('(');
  cleaned = cleaned.replace(/[\+\-\(\)]/g, '');
  if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }
  const value = parseFloat(cleaned);
  if (isNaN(value)) return NaN;
  return isNegative ? -Math.abs(value) : Math.abs(value);
}

function extractMerchant(description) {
  let merchant = description
    .replace(/\d{2}[-\/]\d{2}[-\/]?\d{0,4}/g, '')
    .replace(/[\-\+]?\d{1,10}[,\.]\d{2}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (merchant.length < 3) {
    merchant = description;
  }
  const words = merchant.split(' ').slice(0, 5).join(' ');
  return words.substring(0, 60);
}

// Error handler global
app.use((err, req, res, next) => {
  console.error('Erro capturado:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Erro interno do servidor'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📄 Processar PDF: POST http://localhost:${PORT}/api/process-pdf`);
});

