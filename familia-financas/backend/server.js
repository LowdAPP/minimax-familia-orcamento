#!/usr/bin/env node

const http = require('http');
const pdfParse = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const PORT = process.env.PORT || 3000;

// Inicializar cliente Supabase
// IMPORTANTE: Usar SERVICE_ROLE_KEY para bypassar RLS policies
// O backend precisa inserir transações em nome dos usuários
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  // Verificar se é Service Role Key (começa com 'eyJ' e é mais longa)
  const isServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY && 
                        process.env.SUPABASE_SERVICE_ROLE_KEY.length > 100;
  
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'apikey': supabaseServiceKey
      }
    }
  });
  
  console.log('[INIT] ✅ Supabase client initialized');
  console.log('[INIT] 🔑 Using:', isServiceRole ? 'SERVICE_ROLE_KEY ✅' : 'ANON_KEY ⚠️ (fallback - pode não funcionar)');
  console.log('[INIT] 📍 URL:', supabaseUrl);
  console.log('[INIT] 🔑 Key length:', supabaseServiceKey ? supabaseServiceKey.length : 0);
  
  if (!isServiceRole) {
    console.log('[INIT] ⚠️ AVISO: Usando ANON_KEY como fallback. Configure SUPABASE_SERVICE_ROLE_KEY!');
  }
} else {
  console.log('[INIT] ⚠️ Supabase credentials not configured - database saving disabled');
  console.log('[INIT] ⚠️ Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Função para parsear multipart/form-data
function parseMultipartFormData(buffer, boundary) {
  const parts = {};
  const boundaryStr = '--' + boundary;
  const boundaryBuffer = Buffer.from(boundaryStr);
  const boundaryLen = boundaryBuffer.length;
  
  // Encontra todas as ocorrências do boundary
  const boundaries = [];
  let searchIndex = 0;
  
  while (true) {
    const index = buffer.indexOf(boundaryBuffer, searchIndex);
    if (index === -1) break;
    boundaries.push(index);
    searchIndex = index + boundaryLen;
  }
  
  // Processa cada parte entre os boundaries
  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i] + boundaryLen;
    const end = boundaries[i + 1];
    const part = buffer.slice(start, end);
    
    // Procura pelo fim do header (CRLFCRLF ou LFLF)
    const crlfcrlf = Buffer.from('\r\n\r\n');
    const lflf = Buffer.from('\n\n');
    
    let headerEnd = -1;
    let headerEndLen = 0;
    
    const crlfIndex = part.indexOf(crlfcrlf);
    const lfIndex = part.indexOf(lflf);
    
    if (crlfIndex !== -1 && (lfIndex === -1 || crlfIndex < lfIndex)) {
      headerEnd = crlfIndex;
      headerEndLen = 4;
    } else if (lfIndex !== -1) {
      headerEnd = lfIndex;
      headerEndLen = 2;
    }
    
    if (headerEnd === -1) continue;
    
    const headers = part.slice(0, headerEnd).toString('utf-8');
    const body = part.slice(headerEnd + headerEndLen);
    
    // Extrai o nome do campo do header
    const nameMatch = headers.match(/name="([^"]+)"/);
    if (!nameMatch) continue;
    
    const fieldName = nameMatch[1];
    
    // Verifica se é um arquivo
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    if (filenameMatch) {
      // É um arquivo - remove CRLF/LF do final se existir
      let fileData = body;
      if (fileData.length >= 2 && fileData[fileData.length - 2] === 0x0D && fileData[fileData.length - 1] === 0x0A) {
        fileData = fileData.slice(0, -2);
      } else if (fileData.length >= 1 && fileData[fileData.length - 1] === 0x0A) {
        fileData = fileData.slice(0, -1);
      }
      
      parts[fieldName] = {
        filename: filenameMatch[1],
        data: fileData
      };
    } else {
      // É um campo de texto - remove CRLF/LF do final se existir
      let textData = body;
      if (textData.length >= 2 && textData[textData.length - 2] === 0x0D && textData[textData.length - 1] === 0x0A) {
        textData = textData.slice(0, -2);
      } else if (textData.length >= 1 && textData[textData.length - 1] === 0x0A) {
        textData = textData.slice(0, -1);
      }
      
      parts[fieldName] = textData.toString('utf-8').trim();
    }
  }
  
  return parts;
}

// Função para parsear data no formato DD/MM/YYYY ou DD-MM-YYYY
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Remove espaços e caracteres especiais
  dateStr = dateStr.trim().replace(/\s+/g, '');
  
  // Tenta DD/MM/YYYY ou DD-MM-YYYY
  const match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!match) return null;
  
  let day = parseInt(match[1], 10);
  let month = parseInt(match[2], 10);
  let year = parseInt(match[3], 10);
  
  // Ajusta ano de 2 dígitos
  if (year < 100) {
    year = year < 50 ? 2000 + year : 1900 + year;
  }
  
  // Valida data
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  
  // Formata como YYYY-MM-DD para DATE do PostgreSQL
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Função para parsear valor monetário
function parseAmount(amountStr) {
  if (!amountStr) return null;
  
  // Remove espaços e caracteres especiais, exceto números, vírgula e ponto
  // Primeiro remove espaços (usados como separador de milhares em formato PT)
  let cleaned = amountStr.toString().trim().replace(/\s/g, '').replace(/[^\d,.-]/g, '');
  
  // Se tem vírgula e ponto, assume formato brasileiro: 1.234,56
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // Só vírgula: pode ser 1234,56 ou 1,234 (assume decimal)
    if (cleaned.split(',')[1]?.length === 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(',', '');
    }
  }
  
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : Math.abs(value);
}

// Classe para Auto-Categorização baseada em histórico
class AutoCategorizer {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.exactMatches = new Map(); // descrição exata -> category_id
    this.keywordMatches = new Map(); // palavra-chave -> { category_id, count }
    this.categories = new Map(); // id -> { name, color, icon }
  }

  async train(userId) {
    console.log(`[AutoCategorizer] 🧠 Treinando modelo para usuário ${userId}...`);
    
    try {
      // 1. Carregar todas as categorias do usuário
      const { data: categories, error: catError } = await this.supabase
        .from('categories')
        .select('id, name, color, icon')
        .or(`user_id.eq.${userId},is_system_category.eq.true`);

      if (catError) throw catError;

      categories.forEach(cat => {
        this.categories.set(cat.id, cat);
      });

      // 2. Carregar histórico de transações categorizadas
      // Limitamos a 1000 para performance, focando nas mais recentes
      const { data: transactions, error: txError } = await this.supabase
        .from('transactions')
        .select('description, category_id')
        .eq('user_id', userId)
        .not('category_id', 'is', null)
        .order('transaction_date', { ascending: false })
        .limit(2000);

      if (txError) throw txError;

      if (!transactions || transactions.length === 0) {
        console.log('[AutoCategorizer] ⚠️ Nenhum histórico encontrado para treinamento.');
        return;
      }

      // 3. Construir modelos
      transactions.forEach(tx => {
        if (!tx.description || !tx.category_id) return;

        const desc = tx.description.toLowerCase().trim();
        
        // Modelo de Match Exato
        // Se já existe, mantém (prioridade para mais recentes pois ordenamos desc)
        if (!this.exactMatches.has(desc)) {
          this.exactMatches.set(desc, tx.category_id);
        }

        // Modelo de Palavras-Chave (Simplificado)
        // Tokeniza a descrição e conta frequência de categoria por palavra relevante
        const tokens = desc.split(/[\s\-\.,]+/);
        tokens.forEach(token => {
          if (token.length < 3) return; // Ignora palavras curtas
          if (/^\d+$/.test(token)) return; // Ignora números puros

          if (!this.keywordMatches.has(token)) {
            this.keywordMatches.set(token, {});
          }
          
          const tokenStats = this.keywordMatches.get(token);
          tokenStats[tx.category_id] = (tokenStats[tx.category_id] || 0) + 1;
        });
      });

      console.log(`[AutoCategorizer] ✅ Modelo treinado com ${transactions.length} transações.`);
      console.log(`[AutoCategorizer] 📊 Patterns exatos: ${this.exactMatches.size}, Keywords: ${this.keywordMatches.size}`);

    } catch (error) {
      console.error('[AutoCategorizer] ❌ Erro no treinamento:', error);
    }
  }

  predict(description) {
    if (!description) return null;

    const desc = description.toLowerCase().trim();

    // 1. Tentar Match Exato
    if (this.exactMatches.has(desc)) {
      const catId = this.exactMatches.get(desc);
      const cat = this.categories.get(catId);
      if (cat) {
        return { ...cat, confidence: 'exact', match_type: 'Histórico Exato' };
      }
    }

    // 2. Tentar Match por Palavras-Chave (Frequência)
    const tokens = desc.split(/[\s\-\.,]+/);
    const scores = {};

    tokens.forEach(token => {
      if (token.length < 3 || /^\d+$/.test(token)) return;

      const matches = this.keywordMatches.get(token);
      if (matches) {
        Object.entries(matches).forEach(([catId, count]) => {
          scores[catId] = (scores[catId] || 0) + count;
        });
      }
    });

    // Encontrar categoria com maior pontuação
    let bestCatId = null;
    let maxScore = 0;

    Object.entries(scores).forEach(([catId, score]) => {
      if (score > maxScore) {
        maxScore = score;
        bestCatId = catId;
      }
    });

    // Definir um limiar mínimo de confiança (heurístico)
    if (bestCatId && maxScore >= 2) {
      const cat = this.categories.get(bestCatId);
      if (cat) {
        return { ...cat, confidence: 'keyword', match_type: 'Palavras-chave' };
      }
    }

    return null;
  }
}

// Função para extrair merchant da descrição
function extractMerchant(description) {
  if (!description) return null;
  
  // Remove caracteres especiais e espaços extras
  const cleaned = description.trim().replace(/\s+/g, ' ');
  
  // Tenta extrair nome do estabelecimento (primeiras palavras)
  const words = cleaned.split(' ');
  if (words.length > 0) {
    // Retorna primeiras 2-3 palavras como merchant
    return words.slice(0, 3).join(' ').substring(0, 200);
  }
  
  return cleaned.substring(0, 200);
}

// Função para extrair transações do texto do PDF
function parseTransactionsFromText(text, userId, accountId) {
  const transactions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  console.log(`[PARSE] 📄 Analisando ${lines.length} linhas de texto...`);
  console.log(`[PARSE] 📝 Primeiras 5 linhas:`, lines.slice(0, 5));

  // Múltiplos padrões para diferentes formatos de extrato
  const patterns = [
    {
      name: 'Santander PT - Data Duplicada Sem Espaço',
      // DD-MM-YYYYDD-MM-YYYY (sem espaço entre datas) seguido de descrição e valor em linhas separadas
      // Este padrão precisa ser processado linha por linha, não via regex simples
      isLineByLine: true
    },
    {
      name: 'Santander PT - Data Duplicada',
      // DD-MM-YYYY DD-MM-YYYY Descrição Valor EUR Saldo EUR
      regex: /(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\+\-]?\s*\d{1,3}(?:\.\d{3})*,\d{2})\s*EUR/gi
    },
    {
      name: 'Formato com Data Duplicada e Barra',
      // DD/MM/YYYY DD/MM/YYYY Descrição Valor EUR
      regex: /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\+\-]?\s*\d{1,3}(?:\.\d{3})*,\d{2})\s*EUR/gi
    },
    {
      name: 'Formato Simples - Data Descrição Valor',
      // DD/MM/YYYY ou DD-MM-YYYY Descrição Valor EUR
      regex: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([\+\-]?\s*\d{1,10}(?:[.,]\d{3})*[.,]\d{2})\s*(?:EUR|€)/gi
    },
    {
      name: 'Formato Tabela',
      // Data | Descrição | Valor
      regex: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*[|\t]\s*(.+?)\s*[|\t]\s*([\+\-]?\s*\d{1,10}(?:[.,]\d{3})*[.,]\d{2})/gi
    }
  ];

  // Tenta cada padrão
  for (const pattern of patterns) {
    console.log(`[PARSE] 🔍 Tentando padrão: ${pattern.name}`);
    
    // Padrão especial: Data duplicada sem espaço (formato linha por linha)
    if (pattern.isLineByLine && pattern.name === 'Santander PT - Data Duplicada Sem Espaço') {
      const dateDuplicatedPattern = /^(\d{2}-\d{2}-\d{4})(\d{2}-\d{2}-\d{4})$/;
      // Padrão para valor: pode ter espaços entre milhares (ex: "5 935,98 EUR" ou "+ 180,00 EUR")
      const amountPattern = /([\+\-]?)\s*(\d{1,3}(?:\s*\d{3})*,\d{2})\s*EUR/;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const dateMatch = line.match(dateDuplicatedPattern);
        
        if (dateMatch) {
          // Encontrou linha com data duplicada sem espaço
          const dateStr = dateMatch[1]; // Usa primeira data
          const transactionDate = parseDate(dateStr);
          
          if (!transactionDate) continue;
          
          // Próxima linha deve ser a descrição
          if (i + 1 >= lines.length) continue;
          let description = lines[i + 1].trim();
          
          // Linha seguinte deve ter o valor (e saldo)
          if (i + 2 >= lines.length) continue;
          const amountLine = lines[i + 2].trim();
          const amountMatch = amountLine.match(amountPattern);
          
          if (!amountMatch) continue;
          
          const sign = amountMatch[1] === '+' ? 1 : -1;
          const amountValue = parseAmount(amountMatch[2]);
          
          if (!amountValue || amountValue < 0.01) continue;
          
          const amount = sign * amountValue;
          
          // Limpa descrição
          description = description
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[|\t]/g, ' ')
            .trim();
          
          // Validações
          if (description.length < 3 || description.length > 500) continue;
          if (/^[\d\s\.\,\-\/\+€\$£EURR\$USD]+$/.test(description)) continue;
          
          const lowerDesc = description.toLowerCase();
          if (lowerDesc.includes('disponível') || 
              lowerDesc.includes('autorizado') ||
              lowerDesc.includes('saldo contabilístico') ||
              (lowerDesc.includes('data') && lowerDesc.includes('tipo'))) {
            continue;
          }
          
          // Verifica duplicatas
          const isDuplicate = transactions.some(t =>
            t.transaction_date === transactionDate &&
            Math.abs(t.amount - amount) < 0.01 &&
            t.description === description
          );
          
          if (!isDuplicate) {
            console.log(`[PARSE] ✅ Transação encontrada: ${transactionDate} | ${description.substring(0, 40)} | ${amount}`);
            transactions.push({
              user_id: userId,
              account_id: accountId,
              transaction_date: transactionDate,
              amount: amount,
              description: description,
              merchant: extractMerchant(description),
              transaction_type: amount > 0 ? 'receita' : 'despesa',
              status: 'confirmed',
              source: 'pdf_import'
            });
          }
          
          // Pula as linhas já processadas
          i += 2;
        }
      }
      
      if (transactions.length > 0) {
        console.log(`[PARSE] ✅ Usando padrão ${pattern.name} - ${transactions.length} transações encontradas`);
        break;
      }
      continue;
    }
    
    const textToSearch = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    let matchCount = 0;

    for (const match of textToSearch.matchAll(pattern.regex)) {
      matchCount++;
      try {
        let dateStr, description, amountStr;

        if (pattern.name.includes('Duplicada')) {
          // Formato com data duplicada: usa primeira data
          dateStr = match[1];
          description = match[3];
          amountStr = match[4];
        } else {
          // Formato simples
          dateStr = match[1];
          description = match[2];
          amountStr = match[3];
        }

        const transactionDate = parseDate(dateStr);
        if (!transactionDate) {
          console.log(`[PARSE] ⚠️ Data inválida: ${dateStr}`);
          continue;
        }

        // Parse do valor
        const amountValue = parseAmount(amountStr);
        if (!amountValue || amountValue < 0.01) {
          console.log(`[PARSE] ⚠️ Valor inválido: ${amountStr}`);
          continue;
        }

        // Determina sinal (se não tem sinal explícito, assume negativo para despesas)
        let amount = amountValue;
        if (amountStr.trim().startsWith('+')) {
          amount = amountValue;
        } else if (amountStr.trim().startsWith('-')) {
          amount = -amountValue;
        } else {
          // Se não tem sinal, assume negativo (despesa)
          amount = -amountValue;
        }

        // Limpa descrição
        description = description
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/[|\t]/g, ' ')
          .replace(/(?:EUR|€|R\$|\$|USD)\d+[.,]\d+(?:EUR|€|R\$|\$|USD)?/g, '')
          .trim();

        // Validações
        if (description.length < 3 || description.length > 500) {
          console.log(`[PARSE] ⚠️ Descrição muito curta/longa: ${description.substring(0, 50)}`);
          continue;
        }

        if (/^[\d\s\.\,\-\/\+€\$£EURR\$USD]+$/.test(description)) {
          console.log(`[PARSE] ⚠️ Descrição só tem números: ${description}`);
          continue;
        }

        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('disponível') || 
            lowerDesc.includes('autorizado') ||
            lowerDesc.includes('saldo contabilístico') ||
            lowerDesc.includes('data') && lowerDesc.includes('tipo')) {
          continue;
        }

        // Verifica duplicatas
        const isDuplicate = transactions.some(t =>
          t.transaction_date === transactionDate &&
          Math.abs(t.amount - amount) < 0.01 &&
          t.description === description
        );

        if (!isDuplicate) {
          console.log(`[PARSE] ✅ Transação encontrada: ${transactionDate} | ${description.substring(0, 40)} | ${amount}`);
          transactions.push({
            user_id: userId,
            account_id: accountId,
            transaction_date: transactionDate,
            amount: amount,
            description: description,
            merchant: extractMerchant(description),
            transaction_type: amount > 0 ? 'receita' : 'despesa',
            status: 'confirmed',
            source: 'pdf_import'
          });
        }
      } catch (error) {
        console.log(`[PARSE] ❌ Erro ao processar match:`, error.message);
        continue;
      }
    }

    console.log(`[PARSE] 📊 Padrão ${pattern.name}: ${matchCount} matches encontrados`);
    
    // Se encontrou transações com este padrão, para de tentar outros
    if (transactions.length > 0) {
      console.log(`[PARSE] ✅ Usando padrão ${pattern.name} - ${transactions.length} transações encontradas`);
      break;
    }
  }

  // Se não encontrou com padrões, tenta método linha por linha (fallback)
  if (transactions.length === 0) {
    console.log(`[PARSE] 🔄 Nenhuma transação encontrada com padrões, tentando método linha por linha...`);
    
    const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
    const amountPattern = /([\+\-]?)\s*(\d{1,10}(?:[.,]\d{3})*[.,]\d{2})\s*(?:EUR|€|R\$|\$|USD)?/gi;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dateMatch = line.match(datePattern);
      if (!dateMatch) continue;

      if (line.includes('DataTipoDescritivo') || 
          line.includes('Saldo contabilístico') ||
          (line.includes('Data') && line.includes('Descrição') && line.includes('Valor'))) {
        continue;
      }

      const dateStr = dateMatch[1];
      const transactionDate = parseDate(dateStr);
      if (!transactionDate) continue;

      let description = '';
      let amount = null;

      const lineAfterDate = line.substring(line.indexOf(dateStr) + dateStr.length).trim();
      const hasDescriptionInLine = lineAfterDate.length > 3 && 
                                    !/^[\d\s\-EUR€R\$£\$USD]+$/.test(lineAfterDate);

      if (hasDescriptionInLine) {
        description = lineAfterDate;
        const amountMatches = [...line.matchAll(amountPattern)];
        if (amountMatches.length > 0) {
          const amountMatch = amountMatches[0];
          const sign = amountMatch[1] === '+' ? 1 : -1;
          const value = parseAmount(amountMatch[2]);
          if (value) {
            amount = sign * value;
            description = description.replace(amountMatch[0], '').trim();
          }
        } else if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextAmountMatches = [...nextLine.matchAll(amountPattern)];
          if (nextAmountMatches.length > 0) {
            const amountMatch = nextAmountMatches[0];
            const sign = amountMatch[1] === '+' ? 1 : -1;
            const value = parseAmount(amountMatch[2]);
            if (value) {
              amount = sign * value;
            }
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
            if (value) {
              amount = sign * value;
              description = description.replace(amountMatch[0], '').trim();
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
      if (description.length < 3 || description.length > 500) continue;
      if (/^[\d\s\.\,\-\/\+€\$£EURR\$USD]+$/.test(description)) continue;

      const lowerDesc = description.toLowerCase();
      if (lowerDesc.includes('disponível') || lowerDesc.includes('autorizado')) continue;

      const isDuplicate = transactions.some(t =>
        t.transaction_date === transactionDate &&
        Math.abs(t.amount - amount) < 0.01 &&
        t.description === description
      );

      if (!isDuplicate) {
        transactions.push({
          user_id: userId,
          account_id: accountId,
          transaction_date: transactionDate,
          amount: amount,
          description: description,
          merchant: extractMerchant(description),
          transaction_type: amount > 0 ? 'receita' : 'despesa',
          status: 'confirmed',
          source: 'pdf_import'
        });
      }
    }
  }

  console.log(`[PARSE] ✅ Total de ${transactions.length} transações parseadas`);
  return transactions;
}

// Função para salvar transações no Supabase
async function saveTransactionsToSupabase(transactions) {
  if (!supabase) {
    console.log('[DB] ⚠️ Supabase not configured, skipping database save');
    return { success: false, reason: 'Supabase not configured', inserted: 0 };
  }

  if (transactions.length === 0) {
    return { success: true, inserted: 0, reason: 'No transactions to save' };
  }

  try {
    console.log(`[DB] 💾 Tentando salvar ${transactions.length} transações...`);
    console.log(`[DB] 📋 Primeira transação (exemplo):`, JSON.stringify(transactions[0], null, 2));
    
    // Valida formato das transações antes de inserir
    const invalidTransactions = transactions.filter(t => {
      return !t.user_id || !t.account_id || !t.transaction_date || !t.amount;
    });
    
    if (invalidTransactions.length > 0) {
      console.error(`[DB] ❌ ${invalidTransactions.length} transações com campos inválidos:`, invalidTransactions[0]);
      return { success: false, reason: `${invalidTransactions.length} transações com campos obrigatórios faltando`, inserted: 0 };
    }
    
    // Usar RPC ou inserção direta com service role
    // Service role key deve bypassar RLS automaticamente
    console.log('[DB] 🔑 Verificando se está usando service role...');
    console.log('[DB] 📊 Tentando inserir', transactions.length, 'transações');
    
    // Tentar inserção direta primeiro
    // Se falhar com RLS, tentar usar RPC function
    let { data, error } = await supabase
      .from('transactions')
      .insert(transactions)
      .select('id');
    
    // Se der erro de RLS, tentar usar função RPC que bypassa RLS
    if (error && (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS'))) {
      console.log('[DB] 🔄 Erro de RLS detectado, tentando usar função RPC...');
      
      // Tentar inserir via RPC function (se existir)
      // Converter transações para formato JSONB array
      const transactionsJsonb = transactions.map(t => ({
        user_id: t.user_id,
        account_id: t.account_id,
        category_id: t.category_id || null,
        transaction_date: t.transaction_date,
        amount: t.amount.toString(),
        description: t.description,
        merchant: t.merchant || null,
        transaction_type: t.transaction_type,
        status: t.status || 'confirmed',
        source: t.source || 'pdf_import'
      }));
      
      const { data: rpcData, error: rpcError } = await supabase.rpc('insert_transactions_bulk', {
        transactions_data: transactionsJsonb
      });
      
      if (!rpcError && rpcData) {
        console.log('[DB] ✅ Inserção via RPC funcionou!');
        data = rpcData;
        error = null;
      } else {
        console.log('[DB] ⚠️ RPC function não existe, tentando inserção em lote menor...');
        
        // Tentar inserir em lotes menores (às vezes ajuda)
        const batchSize = 10;
        const batches = [];
        for (let i = 0; i < transactions.length; i += batchSize) {
          batches.push(transactions.slice(i, i + batchSize));
        }
        
        let allData = [];
        let hasError = false;
        
        for (const batch of batches) {
          const { data: batchData, error: batchError } = await supabase
            .from('transactions')
            .insert(batch)
            .select('id');
          
          if (batchError) {
            console.error(`[DB] ❌ Erro ao inserir lote:`, batchError.message);
            hasError = true;
            error = batchError;
            break;
          }
          
          if (batchData) {
            allData = allData.concat(batchData);
          }
        }
        
        if (!hasError) {
          data = allData;
          error = null;
        }
      }
    }

    if (error) {
      console.error('[DB] ❌ Erro ao salvar no Supabase:', JSON.stringify(error, null, 2));
      console.error('[DB] ❌ Código do erro:', error.code);
      console.error('[DB] ❌ Mensagem:', error.message);
      console.error('[DB] ❌ Detalhes:', error.details);
      console.error('[DB] ❌ Hint:', error.hint);
      
      // Se der erro de RLS, verificar qual role está sendo usada
      if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS')) {
        console.error('[DB] ❌ ERRO DE RLS DETECTADO!');
        console.error('[DB] ❌ Isso indica que não está usando SERVICE_ROLE_KEY corretamente');
        console.error('[DB] ❌ Verifique se SUPABASE_SERVICE_ROLE_KEY está configurada no Railway');
        console.error('[DB] ❌ Service Role Key deve começar com "eyJ" e ter mais de 100 caracteres');
        console.error('[DB] 🔄 Tentando usar função RPC como fallback...');
        
        // Tentar RPC novamente aqui também (caso o código acima não tenha executado)
        try {
          const transactionsJsonb = transactions.map(t => ({
            user_id: t.user_id,
            account_id: t.account_id,
            category_id: t.category_id || null,
            transaction_date: t.transaction_date,
            amount: t.amount.toString(),
            description: t.description,
            merchant: t.merchant || null,
            transaction_type: t.transaction_type,
            status: t.status || 'confirmed',
            source: t.source || 'pdf_import'
          }));
          
          console.log('[DB] 🔄 Chamando função RPC insert_transactions_bulk...');
          const { data: rpcData, error: rpcError } = await supabase.rpc('insert_transactions_bulk', {
            transactions_data: transactionsJsonb
          });
          
          if (rpcError) {
            console.error('[DB] ❌ Erro na função RPC:', rpcError);
            console.error('[DB] ❌ A função insert_transactions_bulk pode não existir no banco');
            console.error('[DB] ❌ Execute a migration: 1763000001_create_insert_transactions_bulk_function.sql');
          } else if (rpcData) {
            console.log('[DB] ✅ Inserção via RPC funcionou!', rpcData.length, 'transações inseridas');
            data = rpcData;
            error = null;
          }
        } catch (rpcErr) {
          console.error('[DB] ❌ Exceção ao chamar RPC:', rpcErr.message);
        }
      }
      
      // Se ainda tiver erro após tentar RPC, retornar
      if (error) {
        return { success: false, reason: error.message || 'Erro desconhecido', errorCode: error.code, inserted: 0 };
      }
    }

    const insertedCount = data ? data.length : 0;
    console.log(`[DB] ✅ ${insertedCount} transações salvas com sucesso!`);
    return { success: true, inserted: insertedCount };
  } catch (err) {
    console.error('[DB] ❌ Exceção ao salvar no Supabase:', err.message);
    console.error('[DB] ❌ Stack:', err.stack);
    return { success: false, reason: err.message, inserted: 0 };
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
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: timestamp,
      service: 'pdf-processor-backend',
      version: '1.0.0',
      supabase: supabase ? 'configured' : 'not configured'
    }));
    return;
  }

  // Debug endpoint - extrai texto do PDF sem salvar
  if (req.url === '/api/debug-pdf' && req.method === 'POST') {
    try {
      const contentType = req.headers['content-type'] || '';
      
      if (!contentType.includes('multipart/form-data')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Content-Type deve ser multipart/form-data'
        }));
        return;
      }

      const boundaryMatch = contentType.match(/boundary=([^;]+)/);
      if (!boundaryMatch) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Boundary não encontrado'
        }));
        return;
      }

      const boundary = boundaryMatch[1].trim();
      const buffer = await new Promise((resolve, reject) => {
        let data = Buffer.alloc(0);
        req.on('data', chunk => {
          data = Buffer.concat([data, chunk]);
          if (data.length > 50 * 1024 * 1024) {
            reject(new Error('Arquivo muito grande'));
          }
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });

      const formData = parseMultipartFormData(buffer, boundary);
      
      if (!formData.file || !formData.file.data) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Arquivo PDF não encontrado'
        }));
        return;
      }

      const pdfData = await pdfParse(formData.file.data);
      const text = pdfData.text;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        pdfPages: pdfData.numpages,
        textLength: text.length,
        linesCount: lines.length,
        firstLines: lines.slice(0, 20),
        sampleText: text.substring(0, 2000), // Primeiros 2000 caracteres
        timestamp: timestamp
      }));
      return;

    } catch (error) {
      console.error(`[${timestamp}] ❌ Erro no debug:`, error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message
      }));
      return;
    }
  }

  // PDF processing endpoint
  if (req.url === '/api/process-pdf' && req.method === 'POST') {
    try {
      const contentType = req.headers['content-type'] || '';
      
      if (!contentType.includes('multipart/form-data')) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Content-Type deve ser multipart/form-data'
        }));
        return;
      }

      // Extrai boundary do content-type
      const boundaryMatch = contentType.match(/boundary=([^;]+)/);
      if (!boundaryMatch) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Boundary não encontrado no Content-Type'
        }));
        return;
      }

      const boundary = boundaryMatch[1].trim();

      // Lê o body completo
      const buffer = await new Promise((resolve, reject) => {
        let data = Buffer.alloc(0);
        req.on('data', chunk => {
          data = Buffer.concat([data, chunk]);
          if (data.length > 50 * 1024 * 1024) { // 50MB limit
            reject(new Error('Arquivo muito grande (máximo 50MB)'));
          }
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });

      // Parse do multipart
      const formData = parseMultipartFormData(buffer, boundary);

      // Valida campos obrigatórios
      if (!formData.file || !formData.file.data) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Arquivo PDF não encontrado no FormData'
        }));
        return;
      }

      if (!formData.user_id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'user_id não fornecido'
        }));
        return;
      }

      if (!formData.account_id) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'account_id não fornecido'
        }));
        return;
      }

      const userId = formData.user_id;
      const accountId = formData.account_id;
      const pdfBuffer = formData.file.data;

      console.log(`[${timestamp}] 📄 Processando PDF (${pdfBuffer.length} bytes) para user ${userId}, account ${accountId}...`);

      // Processa o PDF
      const pdfData = await pdfParse(pdfBuffer);
      const text = pdfData.text;

      console.log(`[${timestamp}] 📖 PDF parseado: ${pdfData.numpages} páginas, ${text.length} caracteres`);

      // Extrai transações
      const transactions = parseTransactionsFromText(text, userId, accountId);

      console.log(`[${timestamp}] 💰 ${transactions.length} transações encontradas`);

      // Salva no banco de dados
      const dbResult = await saveTransactionsToSupabase(transactions);

      console.log(`[${timestamp}] 💾 Resultado do salvamento:`, JSON.stringify(dbResult, null, 2));
      
      // Se houve erro ao salvar, ainda retorna sucesso mas com informação do erro
      const response = {
        success: true,
        message: 'PDF processado com sucesso',
        transactionsFound: transactions.length,
        transactionsInserted: dbResult.inserted || 0,
        transactions: transactions.slice(0, 10), // Primeiras 10 para o frontend detectar o mês
        pdfPages: pdfData.numpages,
        databaseSave: dbResult,
        timestamp: timestamp
      };

      // Adiciona aviso se não salvou
      if (dbResult.inserted === 0 && transactions.length > 0) {
        response.warning = 'Transações encontradas mas não foram salvas no banco de dados';
        response.error = dbResult.reason || 'Erro desconhecido ao salvar';
        console.log(`[${timestamp}] ⚠️ AVISO: ${transactions.length} transações encontradas mas 0 salvas!`);
        console.log(`[${timestamp}] ⚠️ Motivo: ${dbResult.reason || 'Desconhecido'}`);
      }

      // Retorna resultado (formato compatível com frontend)
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
      return;

    } catch (error) {
      console.error(`[${timestamp}] ❌ Erro ao processar PDF:`, error.message);
      console.error(error.stack);

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message,
        timestamp: timestamp
      }));
      return;
    }
  }

  // 404 para rotas desconhecidas
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not found',
    path: req.url,
    method: req.method
  }));
});

server.listen(PORT, '0.0.0.0', () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ✅ Servidor rodando na porta ${PORT}`);
  console.log(`[${timestamp}] 🏥 Health check: GET /health`);
  console.log(`[${timestamp}] 📄 API: POST /api/process-pdf`);
  console.log(`[${timestamp}] 🚀 Pronto para receber requisições!`);
  console.log(`[${timestamp}] 📍 PORT: ${process.env.PORT || 'não definido (usando 3000)'}`);
  console.log(`[${timestamp}] 🔧 Supabase: ${supabase ? '✅ Configurado' : '❌ Não configurado'}`);
});

server.on('error', (error) => {
  console.error('[ERROR] ❌ Erro no servidor:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`⚠️ Porta ${PORT} já está em uso`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SIGTERM] 🛑 Recebido SIGTERM, encerrando servidor...');
  server.close(() => {
    console.log('[SIGTERM] ✅ Servidor encerrado');
    process.exit(0);
  });
});
