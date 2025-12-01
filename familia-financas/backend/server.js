#!/usr/bin/env node

const http = require('http');
const pdfParse = require('pdf-parse');
const { parse } = require('csv-parse/sync');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const PORT = process.env.PORT || 3000;

// Inicializar cliente Supabase
// IMPORTANTE: Usar SERVICE_ROLE_KEY para bypassar RLS policies
// O backend precisa inserir transações em nome dos usuários
const supabaseUrl = process.env.SUPABASE_URL;
// ATENÇÃO: SERVICE_ROLE_KEY é obrigatória para operação segura do backend
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  // Verificar se é Service Role Key (começa com 'eyJ' e é mais longa)
  const isServiceRole = supabaseServiceKey.length > 100;
  
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
  console.log('[INIT] 📍 URL configured');
  
  if (!isServiceRole) {
    console.warn('[INIT] ⚠️ AVISO: A chave configurada parece curta. Certifique-se de usar a SERVICE_ROLE_KEY.');
  }
} else {
  console.error('[INIT] ❌ ERRO CRÍTICO: Supabase credentials not configured');
  console.error('[INIT] ❌ Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  // Não encerramos o processo para permitir debug, mas as operações de banco falharão
}

/**
 * Verifica o token JWT do usuário
 * @param {string} token - Token JWT Bearer
 * @returns {Promise<User|null>} - Objeto User do Supabase ou null se inválido
 */
async function verifyAuthToken(token) {
  if (!token || !supabase) return null;
  
  try {
    // Remove 'Bearer ' se presente
    const cleanToken = token.replace('Bearer ', '');
    
    // Usa o client com service role para validar o token do usuário
    const { data: { user }, error } = await supabase.auth.getUser(cleanToken);
    
    if (error || !user) {
      if (error) console.error('[AUTH] Erro na validação do token:', error.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('[AUTH] Exceção na validação:', error.message);
    return null;
  }
}

/**
 * Busca o tenant_id do usuário
 * @param {string} userId 
 * @returns {Promise<string|null>}
 */
async function getUserTenantId(userId) {
  if (!supabase) return null;
  try {
    // 1. Tentar user_profiles (principal)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', userId)
      .single();
      
    if (profile && profile.tenant_id) return profile.tenant_id;
    
    // 2. Tentar users (fallback/legado)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single();
      
    if (user && user.tenant_id) return user.tenant_id;
    
    return null;
  } catch (error) {
    console.error('[AUTH] Erro ao buscar tenant_id:', error.message);
    return null;
  }
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

// Função para processar CSV e extrair transações
function parseTransactionsFromCSV(csvBuffer, userId, accountId, tenantId) {
  const transactions = [];
  
  try {
    console.log(`[CSV] 📄 Processando CSV (${csvBuffer.length} bytes)...`);
    
    // Converte buffer para string
    const csvText = csvBuffer.toString('utf-8');
    
    // Parse do CSV usando csv-parse
    const records = parse(csvText, {
      columns: true, // Primeira linha como cabeçalho
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true // Permite linhas com número diferente de colunas
    });
    
    console.log(`[CSV] 📊 ${records.length} linhas encontradas no CSV`);
    
    // Tenta detectar colunas automaticamente (formatos comuns)
    let dateColumn = null;
    let descriptionColumn = null;
    let amountColumn = null;
    let typeColumn = null;
    
    if (records.length > 0) {
      const headers = Object.keys(records[0]);
      console.log(`[CSV] 📋 Colunas detectadas: ${headers.join(', ')}`);
      
      // Busca colunas por nomes comuns (case-insensitive)
      headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (!dateColumn && (lowerHeader.includes('data') || lowerHeader.includes('date'))) {
          dateColumn = header;
        }
        if (!descriptionColumn && (lowerHeader.includes('descrição') || lowerHeader.includes('descricao') || 
            lowerHeader.includes('description') || lowerHeader.includes('desc') || 
            lowerHeader.includes('histórico') || lowerHeader.includes('historico'))) {
          descriptionColumn = header;
        }
        if (!amountColumn && (lowerHeader.includes('valor') || lowerHeader.includes('amount') || 
            lowerHeader.includes('montante') || lowerHeader.includes('total'))) {
          amountColumn = header;
        }
        if (!typeColumn && (lowerHeader.includes('tipo') || lowerHeader.includes('type') || 
            lowerHeader.includes('débito') || lowerHeader.includes('debito') || 
            lowerHeader.includes('crédito') || lowerHeader.includes('credito'))) {
          typeColumn = header;
        }
      });
      
      // Se não encontrou, tenta usar as primeiras colunas como padrão
      if (!dateColumn && headers.length >= 1) dateColumn = headers[0];
      if (!descriptionColumn && headers.length >= 2) descriptionColumn = headers[1];
      if (!amountColumn && headers.length >= 3) amountColumn = headers[2];
    }
    
    console.log(`[CSV] 🔍 Colunas mapeadas: Data=${dateColumn}, Descrição=${descriptionColumn}, Valor=${amountColumn}, Tipo=${typeColumn || 'auto'}`);
    
    // Processa cada linha
    for (const record of records) {
      try {
        // Extrai dados
        const dateStr = record[dateColumn] || '';
        const description = (record[descriptionColumn] || '').trim();
        const amountStr = record[amountColumn] || '';
        const typeStr = (record[typeColumn] || '').toLowerCase().trim();
        
        // Valida campos obrigatórios
        if (!dateStr || !description || !amountStr) {
          continue;
        }
        
        // Parse da data
        const transactionDate = parseDate(dateStr);
        if (!transactionDate) {
          console.log(`[CSV] ⚠️ Data inválida na linha: ${dateStr}`);
          continue;
        }
        
        // Parse do valor
        const amountValue = parseAmount(amountStr);
        if (!amountValue || amountValue < 0.01) {
          console.log(`[CSV] ⚠️ Valor inválido na linha: ${amountStr}`);
          continue;
        }
        
        // Determina tipo de transação
        let amount = amountValue;
        let transactionType = 'despesa';
        
        if (typeStr) {
          if (typeStr.includes('crédito') || typeStr.includes('credito') || 
              typeStr.includes('receita') || typeStr.includes('entrada') || 
              typeStr.includes('credit') || typeStr.includes('income')) {
            transactionType = 'receita';
            amount = amountValue;
          } else if (typeStr.includes('débito') || typeStr.includes('debito') || 
                     typeStr.includes('despesa') || typeStr.includes('saída') || 
                     typeStr.includes('saida') || typeStr.includes('debit') || 
                     typeStr.includes('expense')) {
            transactionType = 'despesa';
            amount = -amountValue;
          }
        } else {
          // Se não tem tipo, verifica se o valor é negativo ou positivo
          // Se o valor original já tinha sinal, usa ele
          if (amountStr.trim().startsWith('-')) {
            amount = -amountValue;
            transactionType = 'despesa';
          } else if (amountStr.trim().startsWith('+')) {
            amount = amountValue;
            transactionType = 'receita';
          } else {
            // Por padrão, assume despesa (valor negativo)
            amount = -amountValue;
            transactionType = 'despesa';
          }
        }
        
        // Valida descrição
        if (description.length < 3 || description.length > 500) {
          continue;
        }
        
        // Verifica duplicatas
        const isDuplicate = transactions.some(t =>
          t.transaction_date === transactionDate &&
          Math.abs(t.amount - amount) < 0.01 &&
          t.description === description
        );
        
        if (!isDuplicate) {
          console.log(`[CSV] ✅ Transação: ${transactionDate} | ${description.substring(0, 40)} | ${amount}`);
          transactions.push({
            user_id: userId,
            account_id: accountId,
            tenant_id: tenantId,
            transaction_date: transactionDate,
            amount: amount,
            description: description,
            merchant: extractMerchant(description),
            transaction_type: transactionType,
            status: 'confirmed',
            source: 'pdf_import' // Mantém compatibilidade com o frontend
          });
        }
      } catch (rowError) {
        console.log(`[CSV] ⚠️ Erro ao processar linha: ${rowError.message}`);
        continue;
      }
    }
    
    console.log(`[CSV] ✅ Total de ${transactions.length} transações parseadas do CSV`);
    return transactions;
  } catch (error) {
    console.error(`[CSV] ❌ Erro ao processar CSV:`, error.message);
    throw error;
  }
}

// Função para processar Excel (XLS/XLSX) e extrair transações
function parseTransactionsFromExcel(excelBuffer, userId, accountId, tenantId) {
  const transactions = [];
  
  try {
    console.log(`[EXCEL] 📄 Processando Excel (${excelBuffer.length} bytes)...`);
    
    // Lê o arquivo Excel
    const workbook = xlsx.read(excelBuffer, { type: 'buffer' });
    
    // Pega a primeira planilha
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converte para JSON
    const records = xlsx.utils.sheet_to_json(worksheet, {
      defval: '', // Valor padrão para células vazias
      raw: false // Converte valores para string
    });
    
    console.log(`[EXCEL] 📊 ${records.length} linhas encontradas na planilha "${sheetName}"`);
    
    if (records.length === 0) {
      console.log(`[EXCEL] ⚠️ Planilha vazia`);
      return transactions;
    }
    
    // Detecta colunas (mesma lógica do CSV)
    let dateColumn = null;
    let descriptionColumn = null;
    let amountColumn = null;
    let typeColumn = null;
    
    const headers = Object.keys(records[0]);
    console.log(`[EXCEL] 📋 Colunas detectadas: ${headers.join(', ')}`);
    
    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      if (!dateColumn && (lowerHeader.includes('data') || lowerHeader.includes('date'))) {
        dateColumn = header;
      }
      if (!descriptionColumn && (lowerHeader.includes('descrição') || lowerHeader.includes('descricao') || 
          lowerHeader.includes('description') || lowerHeader.includes('desc') || 
          lowerHeader.includes('histórico') || lowerHeader.includes('historico'))) {
        descriptionColumn = header;
      }
      if (!amountColumn && (lowerHeader.includes('valor') || lowerHeader.includes('amount') || 
          lowerHeader.includes('montante') || lowerHeader.includes('total'))) {
        amountColumn = header;
      }
      if (!typeColumn && (lowerHeader.includes('tipo') || lowerHeader.includes('type') || 
          lowerHeader.includes('débito') || lowerHeader.includes('debito') || 
          lowerHeader.includes('crédito') || lowerHeader.includes('credito'))) {
        typeColumn = header;
      }
    });
    
    // Fallback para primeiras colunas
    if (!dateColumn && headers.length >= 1) dateColumn = headers[0];
    if (!descriptionColumn && headers.length >= 2) descriptionColumn = headers[1];
    if (!amountColumn && headers.length >= 3) amountColumn = headers[2];
    
    console.log(`[EXCEL] 🔍 Colunas mapeadas: Data=${dateColumn}, Descrição=${descriptionColumn}, Valor=${amountColumn}, Tipo=${typeColumn || 'auto'}`);
    
    // Processa cada linha (mesma lógica do CSV)
    for (const record of records) {
      try {
        const dateStr = String(record[dateColumn] || '').trim();
        const description = String(record[descriptionColumn] || '').trim();
        const amountStr = String(record[amountColumn] || '').trim();
        const typeStr = String(record[typeColumn] || '').toLowerCase().trim();
        
        if (!dateStr || !description || !amountStr) {
          continue;
        }
        
        // Parse da data (Excel pode retornar números de data serial ou strings formatadas)
        let transactionDate = parseDate(dateStr);
        
        // Se não conseguiu parsear como string, tenta como número serial do Excel
        // Excel usa 1 de janeiro de 1900 como base (mas tem bug do ano 1900, então ajustamos)
        if (!transactionDate && !isNaN(dateStr) && parseFloat(dateStr) > 0) {
          const excelSerial = parseFloat(dateStr);
          // Excel serial date: 1 = 1900-01-01, mas Excel trata 1900 como bissexto (bug)
          // Ajuste: subtrai 2 dias para compensar o bug do Excel
          const baseDate = new Date(1899, 11, 30); // 30 de dezembro de 1899
          const jsDate = new Date(baseDate.getTime() + excelSerial * 86400000);
          
          if (!isNaN(jsDate.getTime())) {
            const year = jsDate.getFullYear();
            const month = String(jsDate.getMonth() + 1).padStart(2, '0');
            const day = String(jsDate.getDate()).padStart(2, '0');
            transactionDate = `${year}-${month}-${day}`;
          }
        }
        
        if (!transactionDate) {
          console.log(`[EXCEL] ⚠️ Data inválida na linha: ${dateStr}`);
          continue;
        }
        
        const amountValue = parseAmount(amountStr);
        if (!amountValue || amountValue < 0.01) {
          console.log(`[EXCEL] ⚠️ Valor inválido na linha: ${amountStr}`);
          continue;
        }
        
        let amount = amountValue;
        let transactionType = 'despesa';
        
        if (typeStr) {
          if (typeStr.includes('crédito') || typeStr.includes('credito') || 
              typeStr.includes('receita') || typeStr.includes('entrada') || 
              typeStr.includes('credit') || typeStr.includes('income')) {
            transactionType = 'receita';
            amount = amountValue;
          } else {
            transactionType = 'despesa';
            amount = -amountValue;
          }
        } else {
          if (amountStr.trim().startsWith('-') || amountValue < 0) {
            amount = -Math.abs(amountValue);
            transactionType = 'despesa';
          } else {
            amount = Math.abs(amountValue);
            transactionType = 'receita';
          }
        }
        
        if (description.length < 3 || description.length > 500) {
          continue;
        }
        
        const isDuplicate = transactions.some(t =>
          t.transaction_date === transactionDate &&
          Math.abs(t.amount - amount) < 0.01 &&
          t.description === description
        );
        
        if (!isDuplicate) {
          console.log(`[EXCEL] ✅ Transação: ${transactionDate} | ${description.substring(0, 40)} | ${amount}`);
          transactions.push({
            user_id: userId,
            account_id: accountId,
            tenant_id: tenantId,
            transaction_date: transactionDate,
            amount: amount,
            description: description,
            merchant: extractMerchant(description),
            transaction_type: transactionType,
            status: 'confirmed',
            source: 'pdf_import' // Mantém compatibilidade
          });
        }
      } catch (rowError) {
        console.log(`[EXCEL] ⚠️ Erro ao processar linha: ${rowError.message}`);
        continue;
      }
    }
    
    console.log(`[EXCEL] ✅ Total de ${transactions.length} transações parseadas do Excel`);
    return transactions;
  } catch (error) {
    console.error(`[EXCEL] ❌ Erro ao processar Excel:`, error.message);
    throw error;
  }
}

// Função para parsear com Gemini (AI)
async function parseTransactionsWithGemini(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('[AI] ⚠️ GEMINI_API_KEY não configurada. Pulando parse com AI.');
    return [];
  }

  try {
    console.log('[AI] 🤖 Iniciando análise com Gemini 1.5 Flash...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Você é um especialista em extração de dados bancários. Analise o texto abaixo de um extrato bancário e extraia TODAS as transações financeiras.
      
      TEXTO DO EXTRATO:
      """
      ${text.substring(0, 30000)} 
      """
      
      INSTRUÇÕES:
      1. Identifique cada transação com: Data, Descrição, Valor e Nome do Estabelecimento (Merchant).
      2. Ignore saldos parciais, cabeçalhos e rodapés.
      3. Para o valor: 
         - Se for saída/débito, deve ser negativo (ex: -10.50).
         - Se for entrada/crédito, deve ser positivo (ex: 1500.00).
         - Use ponto como separador decimal.
      4. Converta a data para o formato ISO YYYY-MM-DD.
      5. Retorne APENAS um array JSON válido, sem markdown, sem explicações.
      
      Exemplo de formato de saída:
      [
        { "transaction_date": "2025-11-28", "description": "COMPRA SUPERMERCADO", "amount": -50.25, "merchant": "SUPERMERCADO" },
        { "transaction_date": "2025-11-27", "description": "SALARIO MENSAL", "amount": 2500.00, "merchant": "EMPRESA XYZ" }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Limpar markdown se houver
    const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const transactions = JSON.parse(jsonString);
    
    if (!Array.isArray(transactions)) {
      console.error('[AI] ❌ Resposta da AI não é um array:', textResponse.substring(0, 100));
      return [];
    }

    console.log(`[AI] ✅ Gemini encontrou ${transactions.length} transações!`);
    
    return transactions.map(t => ({
      transaction_date: t.transaction_date,
      amount: parseFloat(t.amount),
      description: t.description,
      merchant: t.merchant || extractMerchant(t.description),
      transaction_type: t.amount > 0 ? 'receita' : 'despesa',
      status: 'confirmed',
      source: 'pdf_import_ai'
    }));

  } catch (error) {
    console.error('[AI] ❌ Erro ao processar com Gemini:', error.message);
    return [];
  }
}

// Função para extrair transações do texto do PDF
async function parseTransactionsFromText(text, userId, accountId, tenantId) {
  const transactions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  console.log(`[PARSE] 📄 Analisando ${lines.length} linhas de texto...`);
  console.log(`[PARSE] 🏢 Tenant ID: ${tenantId || 'N/A (Global)'}`);
  console.log(`[PARSE] 📝 Primeiras 5 linhas:`, lines.slice(0, 5));

  // Múltiplos padrões para diferentes formatos de extrato
  const patterns = [
    {
      name: 'Santander PT - Data Duplicada Sem Espaço (Novo)',
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
    },
    {
      name: 'Formato CSV/Exportação',
      // Data,Data,Descrição,Valor (ex: 24-11-2025,24-11-2025,Lidl Montijo,-67.77)
      regex: /(\d{2}-\d{2}-\d{4}),(\d{2}-\d{2}-\d{4}),(.+?),([\+\-]?\d+(?:\.\d+)?)/gi
    }
  ];

  // Tenta cada padrão
  for (const pattern of patterns) {
    console.log(`[PARSE] 🔍 Tentando padrão: ${pattern.name}`);
    
    // Padrão especial: Data duplicada sem espaço (formato linha por linha)
    if (pattern.isLineByLine && pattern.name === 'Santander PT - Data Duplicada Sem Espaço (Novo)') {
      const dateDuplicatedPattern = /^(\d{2}-\d{2}-\d{4})(\d{2}-\d{2}-\d{4})$/;
      const amountPattern = /^([\+\-]?)\s*(\d{1,3}(?:\.\d{3})*,\d{2})\s*EUR/;
      
      let patternTransactions = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const dateMatch = line.match(dateDuplicatedPattern);
        
        if (dateMatch) {
          const dateStr = dateMatch[1]; // Usa primeira data
          const transactionDate = parseDate(dateStr);
          
          if (!transactionDate) continue;
          
          if (i + 1 >= lines.length) continue;
          let description = lines[i + 1].trim();
          
          let amountFound = false;
          let linesToSkip = 1;
          
          for (let j = 1; j <= 3; j++) {
            if (i + j >= lines.length) break;
            
            const potentialAmountLine = lines[i + j].trim();
            const amountMatch = potentialAmountLine.match(amountPattern);
            
            if (amountMatch) {
              if (j > 1) {
                 for (let k = 2; k < j; k++) {
                   description += ' ' + lines[i + k].trim();
                 }
              }
              
              const signStr = amountMatch[1]; 
              const valueStr = amountMatch[2];
              const sign = signStr === '-' ? -1 : 1;
              const amountValue = parseAmount(valueStr);
              
              if (amountValue && amountValue >= 0.01) {
                const amount = sign * amountValue;
                
                description = description.trim().replace(/\s+/g, ' ').replace(/[|\t]/g, ' ').trim();
                
                if (description.length >= 3 && description.length <= 500 && 
                    !/^[\d\s\.\,\-\/\+€\$£EURR\$USD]+$/.test(description)) {
                      
                  const lowerDesc = description.toLowerCase();
                  if (!lowerDesc.includes('disponível') && !lowerDesc.includes('autorizado') &&
                      !lowerDesc.includes('saldo contabilístico') && 
                      !(lowerDesc.includes('data') && lowerDesc.includes('tipo'))) {
                    
                    const isDuplicate = patternTransactions.some(t =>
                      t.transaction_date === transactionDate &&
                      Math.abs(t.amount - amount) < 0.01 &&
                      t.description === description
                    );

                    if (!isDuplicate) {
                      console.log(`[PARSE] ✅ Transação encontrada (Padrão Santander Novo): ${transactionDate} | ${description.substring(0, 30)} | ${amount}`);
                      patternTransactions.push({
                        user_id: userId,
                        account_id: accountId,
                        tenant_id: tenantId,
                        transaction_date: transactionDate,
                        amount: amount,
                        description: description,
                        merchant: extractMerchant(description),
                        transaction_type: amount > 0 ? 'receita' : 'despesa',
                        status: 'confirmed',
                        source: 'pdf_import'
                      });
                      amountFound = true;
                      linesToSkip = j;
                    }
                  }
                }
              }
              break;
            }
          }
          
          if (amountFound) {
            i += linesToSkip; 
          }
        }
      }

      if (patternTransactions.length > 0) {
        console.log(`[PARSE] ✅ Usando padrão ${pattern.name} - ${patternTransactions.length} transações encontradas`);
        return patternTransactions;
      }

    } else if (pattern.isLineByLine && pattern.name === 'Santander PT - Data Duplicada Sem Espaço') {
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
              tenant_id: tenantId, // Adicionado suporte a multitenancy
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
        } else if (pattern.name.includes('CSV')) {
          // Formato CSV: Data, Data, Descrição, Valor
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
            tenant_id: tenantId, // Adicionado suporte a multitenancy
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
          tenant_id: tenantId, // Adicionado suporte a multitenancy
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
  
  // Fallback para Gemini (AI) se não encontrou nada ou muito pouco
  if (transactions.length < 2) {
    console.log('[PARSE] ⚠️ Poucas transações encontradas com Regex. Tentando Gemini AI...');
    try {
      const aiTransactions = await parseTransactionsWithGemini(text);
      if (aiTransactions.length > transactions.length) {
        console.log(`[PARSE] 🤖 Gemini encontrou ${aiTransactions.length} transações. Usando resultado da AI.`);
        // Adicionar IDs e retornar
        return aiTransactions.map(t => ({
          ...t,
          user_id: userId,
          account_id: accountId,
          tenant_id: tenantId
        }));
      }
    } catch (error) {
      console.error('[PARSE] ❌ Erro no fallback AI:', error);
    }
  }

  return transactions;
}

// Função para verificar duplicatas no banco de dados
async function checkDuplicatesInDB(transactions, userId) {
  if (!supabase || transactions.length === 0) return transactions;
  
  try {
    console.log(`[DB] 🔍 Verificando duplicatas no banco para ${transactions.length} transações...`);
    
    // Pegar o account_id da primeira transação (assumindo que todas são para a mesma conta no lote)
    const accountId = transactions[0].account_id;

    // Buscar transações existentes do usuário no mesmo período e MESMA CONTA
    const dates = transactions.map(t => t.transaction_date);
    const minDate = dates.reduce((a, b) => a < b ? a : b);
    const maxDate = dates.reduce((a, b) => a > b ? a : b);
    
    const { data: existingTransactions, error } = await supabase
      .from('transactions')
      .select('transaction_date, description, amount')
      .eq('user_id', userId)
      .eq('account_id', accountId) // Filtrar também pela conta!
      .gte('transaction_date', minDate)
      .lte('transaction_date', maxDate);
    
    if (error) {
      console.log(`[DB] ⚠️ Erro ao verificar duplicatas: ${error.message}, continuando sem verificação...`);
      return transactions;
    }
    
    // Criar um Set de chaves para busca rápida
    const existingKeys = new Set(
      (existingTransactions || []).map(t => {
        const normalizedDesc = t.description.toLowerCase().trim();
        return `${t.transaction_date}|${normalizedDesc}|${Math.abs(t.amount).toFixed(2)}`;
      })
    );
    
    // Filtrar transações que já existem
    const newTransactions = transactions.filter(t => {
      const normalizedDesc = t.description.toLowerCase().trim();
      const key = `${t.transaction_date}|${normalizedDesc}|${Math.abs(t.amount).toFixed(2)}`;
      return !existingKeys.has(key);
    });
    
    const duplicatesCount = transactions.length - newTransactions.length;
    if (duplicatesCount > 0) {
      console.log(`[DB] 🔄 ${duplicatesCount} transações duplicadas encontradas no banco, ${newTransactions.length} novas para inserir`);
    }
    
    return newTransactions;
  } catch (err) {
    console.error('[DB] ❌ Erro ao verificar duplicatas:', err.message);
    return transactions; // Em caso de erro, tenta inserir todas
  }
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
    
    // Verificar duplicatas no banco antes de inserir
    const userId = transactions[0].user_id;
    const transactionsToInsert = await checkDuplicatesInDB(transactions, userId);
    
    if (transactionsToInsert.length === 0) {
      console.log(`[DB] ℹ️ Todas as ${transactions.length} transações já existem no banco (duplicatas)`);
      return { success: true, inserted: 0, reason: 'Todas as transações são duplicadas', duplicates: transactions.length };
    }
    
    console.log(`[DB] 📊 Após verificação de duplicatas: ${transactionsToInsert.length} transações para inserir (${transactions.length - transactionsToInsert.length} duplicadas)`);
    
    // Usar RPC ou inserção direta com service role
    // Service role key deve bypassar RLS automaticamente
    console.log('[DB] 🔑 Verificando se está usando service role...');
    console.log('[DB] 📊 Tentando inserir', transactionsToInsert.length, 'transações');
    
    // Tentar inserção direta primeiro
    // Se falhar com RLS, tentar usar RPC function
    let { data, error } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select('id');
    
    // Se der erro de RLS, tentar usar função RPC que bypassa RLS
    if (error && (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('RLS'))) {
      console.log('[DB] 🔄 Erro de RLS detectado, tentando usar função RPC...');
      
      // Tentar inserir via RPC function (se existir)
      // Converter transações para formato JSONB array
      const transactionsJsonb = transactionsToInsert.map(t => ({
        user_id: t.user_id,
        account_id: t.account_id,
        tenant_id: t.tenant_id || null,
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
        const batchSize = 50; // Aumentar tamanho do lote para melhor performance
        const batches = [];
        for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
          batches.push(transactionsToInsert.slice(i, i + batchSize));
        }
        
        console.log(`[DB] 📦 Dividindo em ${batches.length} lotes de até ${batchSize} transações cada`);
        
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
            tenant_id: t.tenant_id || null,
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
    const duplicatesCount = transactions.length - transactionsToInsert.length;
    console.log(`[DB] ✅ ${insertedCount} transações salvas com sucesso!`);
    console.log(`[DB] 📊 Resumo: ${transactions.length} encontradas, ${duplicatesCount} duplicadas, ${insertedCount} inseridas`);
    return { 
      success: true, 
      inserted: insertedCount,
      duplicates: duplicatesCount,
      totalFound: transactions.length
    };
  } catch (err) {
    console.error('[DB] ❌ Exceção ao salvar no Supabase:', err.message);
    console.error('[DB] ❌ Stack:', err.stack);
    return { success: false, reason: err.message, inserted: 0 };
  }
}

const server = http.createServer(async (req, res) => {
  const timestamp = new Date().toISOString();
  // Log apenas método e URL para evitar vazar dados sensíveis em query params (embora não devamos usar query params sensíveis)
  console.log(`[${timestamp}] ${req.method} ${req.url.split('?')[0]}`);
  console.log(`[VERSION] v1.1.0 - CSV Parser Fix Deploy`);

  // CORS Configuration
  // Permite configurar origens permitidas via variável de ambiente (separadas por vírgula)
  // Se não configurado, permite localhost e vercel.app para desenvolvimento, mas bloqueia outros em produção
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  const defaultAllowedOrigins = [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:4173',
    'https://familia-financas.vercel.app',
    'https://minimax-familia-orcamento.vercel.app' // Adicione outros domínios de produção aqui
  ];
  
  const allowedOrigins = allowedOriginsEnv 
    ? allowedOriginsEnv.split(',').map(o => o.trim()) 
    : defaultAllowedOrigins;

  const origin = req.headers.origin;
  
  // Lógica de CORS:
  // 1. Se tiver origin e estiver na lista -> Permite
  // 2. Se não tiver origin (ex: curl, server-to-server) -> Permite (não é browser)
  // 3. Se tiver origin e NÃO estiver na lista -> Bloqueia (ou permite * se for ambiente dev explícito)
  
  let allowOrigin = '';
  
  if (!origin) {
    allowOrigin = '*'; // Requests sem origin (não-browser)
  } else if (allowedOrigins.includes(origin)) {
    allowOrigin = origin;
  } else {
    // Em desenvolvimento local, podemos ser mais permissivos se necessário, 
    // mas por segurança default, vamos logar a tentativa bloqueada
    console.log(`[CORS] ⚠️ Origem não permitida bloqueada ou tratada como default: ${origin}`);
    // Se a variável ALLOWED_ORIGINS não estiver definida, permitimos * temporariamente para evitar quebra,
    // mas idealmente deveria ser restrito.
    if (!allowedOriginsEnv) {
       allowOrigin = '*'; 
    }
  }

  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info');
    res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight 24h
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint (Público)
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
    // Verificar Autenticação
    const authHeader = req.headers['authorization'];
    const user = await verifyAuthToken(authHeader);
    
    if (!user) {
      console.log(`[AUTH] ❌ Acesso negado a /api/debug-pdf: Token inválido ou ausente`);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Acesso não autorizado. Token inválido ou expirado.'
      }));
      return;
    }

    // Restrição adicional: Debug apenas para usuários específicos ou ambiente de dev
    // (Opcional: verificar role do usuário ou email)

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

  // File processing endpoint (PDF, CSV, XLS/XLSX)
  if (req.url === '/api/process-pdf' && req.method === 'POST') {
    // Verificar Autenticação
    const authHeader = req.headers['authorization'];
    const user = await verifyAuthToken(authHeader);
    
    if (!user) {
      console.log(`[AUTH] ❌ Acesso negado a /api/process-pdf: Token inválido ou ausente`);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Acesso não autorizado. Por favor, faça login novamente.'
      }));
      return;
    }

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
          error: 'Arquivo não encontrado no FormData'
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

      // Validação de Segurança: O user_id do form deve bater com o token autenticado
      if (formData.user_id !== user.id) {
        console.warn(`[SEC] ⚠️ Tentativa de manipulação de ID: Token(${user.id}) vs Form(${formData.user_id})`);
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Ação não permitida. Você só pode processar arquivos para sua própria conta.'
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
      const fileBuffer = formData.file.data;
      const fileName = formData.file.filename || 'arquivo';

      // Buscar tenant_id do usuário para garantir isolamento
      const tenantId = await getUserTenantId(userId);
      if (!tenantId) {
        console.warn(`[SEC] ⚠️ Usuário ${userId} sem tenant_id definido. Usando modo legado (NULL).`);
      }

      // Detecta o tipo de arquivo pela extensão
      const fileExtension = fileName.toLowerCase().split('.').pop();
      const isPDF = fileExtension === 'pdf' || fileName.toLowerCase().endsWith('.pdf');
      const isCSV = fileExtension === 'csv' || fileName.toLowerCase().endsWith('.csv');
      const isXLS = fileExtension === 'xls' || fileExtension === 'xlsx' || 
                    fileName.toLowerCase().endsWith('.xls') || fileName.toLowerCase().endsWith('.xlsx');

      console.log(`[${timestamp}] 📄 Processando arquivo: ${fileName} (${fileBuffer.length} bytes, tipo: ${fileExtension}) para user ${userId}, account ${accountId}, tenant ${tenantId}...`);

      let transactions = [];
      let fileInfo = {};

      // Processa conforme o tipo de arquivo
      if (isPDF) {
        console.log(`[${timestamp}] 📄 Processando como PDF...`);
        const pdfData = await pdfParse(fileBuffer);
        const text = pdfData.text;
        console.log(`[${timestamp}] 📖 PDF parseado: ${pdfData.numpages} páginas, ${text.length} caracteres`);
        transactions = await parseTransactionsFromText(text, userId, accountId, tenantId);
        fileInfo = { pdfPages: pdfData.numpages, fileType: 'pdf' };
      } else if (isCSV) {
        console.log(`[${timestamp}] 📊 Processando como CSV...`);
        transactions = parseTransactionsFromCSV(fileBuffer, userId, accountId, tenantId);
        fileInfo = { fileType: 'csv' };
      } else if (isXLS) {
        console.log(`[${timestamp}] 📊 Processando como Excel...`);
        transactions = parseTransactionsFromExcel(fileBuffer, userId, accountId, tenantId);
        fileInfo = { fileType: 'excel' };
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `Tipo de arquivo não suportado: ${fileExtension}. Formatos aceitos: PDF, CSV, XLS, XLSX`
        }));
        return;
      }

      console.log(`[${timestamp}] 💰 ${transactions.length} transações encontradas`);

      // Salva no banco de dados
      const dbResult = await saveTransactionsToSupabase(transactions);

      console.log(`[${timestamp}] 💾 Resultado do salvamento:`, JSON.stringify(dbResult, null, 2));
      
      // Se houve erro ao salvar, ainda retorna sucesso mas com informação do erro
      const response = {
        success: true,
        message: `${fileInfo.fileType === 'pdf' ? 'PDF' : fileInfo.fileType === 'csv' ? 'CSV' : 'Excel'} processado com sucesso`,
        transactionsFound: transactions.length,
        transactionsInserted: dbResult.inserted || 0,
        transactions: transactions.slice(0, 10), // Primeiras 10 para o frontend detectar o mês
        fileType: fileInfo.fileType,
        ...fileInfo,
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
      console.error(`[${timestamp}] ❌ Erro ao processar arquivo:`, error.message);
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

  // Auto-categorize endpoint (retroactive)
  if (req.url === '/api/auto-categorize' && req.method === 'POST') {
    try {
      // Ler body JSON
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });

      const { userId } = JSON.parse(body);

      if (!userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'userId obrigatório' }));
        return;
      }

      console.log(`[${timestamp}] 🤖 Iniciando auto-categorização retroativa para user ${userId}...`);

      const categorizer = new AutoCategorizer(supabase);
      await categorizer.train(userId);

      // Buscar transações sem categoria
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, description, category_id')
        .eq('user_id', userId)
        .is('category_id', null);

      if (txError) throw txError;

      if (!transactions || transactions.length === 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Nenhuma transação sem categoria encontrada.',
          count: 0 
        }));
        return;
      }

      console.log(`[${timestamp}] 🔍 Analisando ${transactions.length} transações sem categoria...`);

      const updates = [];
      let updateCount = 0;

      for (const tx of transactions) {
        const prediction = categorizer.predict(tx.description);
        if (prediction) {
          updates.push({
            id: tx.id,
            category_id: prediction.id
          });
          updateCount++;
        }
      }

      // Atualizar em lotes de 50
      const batchSize = 50;
      let successCount = 0;

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        // Como supabase.update não aceita array para update em massa com IDs diferentes de forma simples,
        // vamos fazer um loop de promises paralelo para o lote (upsert seria ideal mas requer mudar a query)
        // Ou melhor: usar um loop simples por enquanto para garantir consistência
        
        await Promise.all(batch.map(async (update) => {
            const { error } = await supabase
                .from('transactions')
                .update({ category_id: update.category_id })
                .eq('id', update.id);
            
            if (!error) successCount++;
        }));
      }

      console.log(`[${timestamp}] ✅ Auto-categorização concluída. ${successCount} transações atualizadas.`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `${successCount} transações foram categorizadas automaticamente.`,
        count: successCount,
        totalAnalyzed: transactions.length
      }));
      return;

    } catch (error) {
      console.error(`[${timestamp}] ❌ Erro na auto-categorização:`, error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: error.message }));
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
  console.log(`[${timestamp}] 📄 API: POST /api/process-pdf (suporta PDF, CSV, XLS, XLSX)`);
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
