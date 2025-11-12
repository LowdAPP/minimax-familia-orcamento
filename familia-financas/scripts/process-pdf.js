#!/usr/bin/env node
/**
 * Script para processar PDFs localmente e enviar transações para Supabase
 * 
 * Uso:
 *   node scripts/process-pdf.js <caminho-do-pdf> [user_id] [account_id]
 * 
 * Exemplo:
 *   node scripts/process-pdf.js "../docs/Extrato empresa outubro.pdf"
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

// Verificar se pdf-parse está instalado
let pdfParse;
try {
  pdfParse = (await import('pdf-parse')).default;
} catch (error) {
  console.error('❌ Erro: pdf-parse não está instalado.');
  console.log('📦 Instale com: npm install pdf-parse');
  console.log('   ou: pnpm add pdf-parse');
  process.exit(1);
}

// Configuração do Supabase (opcional - só necessário se for enviar para BD)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.log('ℹ️  Variáveis de ambiente não configuradas.');
  console.log('   O script funcionará apenas para processar e mostrar preview.');
  console.log('   Para enviar para BD, configure .env com:');
  console.log('   VITE_SUPABASE_URL=...');
  console.log('   VITE_SUPABASE_ANON_KEY=...');
  console.log('');
}

// Função para extrair texto do PDF
async function extractTextFromPDF(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('❌ Erro ao ler PDF:', error.message);
    throw error;
  }
}

// Função para parsear transações do texto
function parseTransactionsFromText(text) {
  const transactions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  console.log(`📄 Analisando ${lines.length} linhas...`);
  
  // Padrão de data (pode aparecer duplicada: DD-MM-YYYYDD-MM-YYYY)
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
  
  // Padrão de valor com EUR (formato: - 123,45 EUR ou + 123,45 EUR)
  const amountPattern = /([\+\-])\s*(\d{1,10}(?:[.,]\d{3})*[.,]\d{2})\s*EUR/gi;
  
  // Processar linha por linha procurando padrão: Data (duplicada) -> Descrição -> Valor EUR Saldo
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Verificar se a linha tem data (pode estar duplicada)
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    
    // Pular cabeçalhos
    if (line.includes('DataTipoDescritivo') || line.includes('Saldo contabilístico')) continue;
    
    // Extrair data (pegar primeira ocorrência, mesmo que duplicada)
    const dateStr = dateMatch[1];
    const date = parseDate(dateStr);
    if (!date) continue;
    
    // Formato típico: linha com data, próxima linha com descrição, próxima com valor
    let description = '';
    let amount = null;
    
    // Se a linha tem só data (ou data duplicada), descrição está na próxima linha
    const lineAfterDate = line.substring(line.indexOf(dateStr) + dateStr.length).trim();
    const hasDescriptionInLine = lineAfterDate.length > 3 && !/^[\d\s\-EUR€]+$/.test(lineAfterDate);
    
    if (hasDescriptionInLine) {
      // Descrição na mesma linha após data
      description = lineAfterDate;
      
      // Procurar valor na mesma linha ou próxima
      const amountMatches = [...line.matchAll(amountPattern)];
      if (amountMatches.length > 0) {
        const amountMatch = amountMatches[0];
        const sign = amountMatch[1] === '+' ? 1 : -1;
        const value = parseAmount(amountMatch[2]);
        amount = sign * Math.abs(value);
        // Remover valor da descrição
        description = description.replace(amountMatch[0], '').trim();
      } else if (i + 1 < lines.length) {
        // Valor na próxima linha
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
      // Descrição na próxima linha
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        description = nextLine.trim();
        
        // Valor pode estar na mesma linha da descrição ou na próxima
        const nextAmountMatches = [...nextLine.matchAll(amountPattern)];
        if (nextAmountMatches.length > 0) {
          const amountMatch = nextAmountMatches[0];
          const sign = amountMatch[1] === '+' ? 1 : -1;
          const value = parseAmount(amountMatch[2]);
          amount = sign * Math.abs(value);
          // Remover valor da descrição
          description = description.replace(amountMatch[0], '').trim();
        } else if (i + 2 < lines.length) {
          // Valor na linha seguinte à descrição
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
    
    // Limpar descrição
    description = description
      .replace(/\s+/g, ' ')
      .replace(/[|\t]/g, ' ')
      .replace(/EUR\d+[.,]\d+EUR/g, '') // Remover saldos que ficaram na descrição
      .trim();
    
    // Validar
    if (!amount || isNaN(amount) || Math.abs(amount) < 0.01) continue;
    if (description.length < 3 || description.length > 150) continue;
    if (/^[\d\s\.\,\-\/\+€\$£EUR]+$/.test(description)) continue; // Só números/símbolos
    
    // Filtrar cabeçalhos
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('disponível') || lowerDesc.includes('autorizado')) continue;
    if (lowerDesc.includes('movimentos') && lowerDesc.includes('conta')) continue;
    
    // Verificar duplicata
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

// Converter data para formato ISO
function parseDate(dateStr) {
  const normalized = dateStr.replace(/-/g, '/');
  
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(normalized)) {
    const parts = normalized.split('/');
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2];
    
    // Converter ano de 2 dígitos para 4
    if (year.length === 2) {
      const yearNum = parseInt(year);
      year = yearNum > 50 ? `19${year}` : `20${year}`;
    }
    
    const isoDate = `${year}-${month}-${day}`;
    
    // Validar data
    const testDate = new Date(isoDate);
    if (testDate.toString() === 'Invalid Date') return null;
    
    return isoDate;
  }
  
  return null;
}

// Converter valor para número
function parseAmount(amountStr) {
  let cleaned = amountStr.replace(/\s/g, '').replace(/[EUR€R\$£USD]/gi, '');
  
  const isNegative = cleaned.startsWith('-') || cleaned.includes('(');
  cleaned = cleaned.replace(/[\+\-\(\)]/g, '');
  
  // Detectar formato: último separador define decimal
  if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
    // Formato europeu: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Formato americano ou sem separador de milhar
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const value = parseFloat(cleaned);
  
  if (isNaN(value)) return NaN;
  
  return isNegative ? -Math.abs(value) : Math.abs(value);
}

// Extrair merchant da descrição
function extractMerchant(description) {
  let merchant = description
    .replace(/\d{2}[-\/]\d{2}[-\/]?\d{0,4}/g, '') // Remove datas
    .replace(/[\-\+]?\d{1,10}[,\.]\d{2}/g, '') // Remove valores
    .replace(/\s+/g, ' ')
    .trim();
  
  if (merchant.length < 3) {
    merchant = description;
  }
  
  const words = merchant.split(' ').slice(0, 5).join(' ');
  return words.substring(0, 60);
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 Uso: node scripts/process-pdf.js <caminho-do-pdf> [user_id] [account_id]');
    console.log('');
    console.log('Exemplo:');
    console.log('  node scripts/process-pdf.js "../docs/Extrato empresa outubro.pdf"');
    process.exit(1);
  }
  
  const pdfPath = path.resolve(args[0]);
  const userId = args[1];
  const accountId = args[2];
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ Arquivo não encontrado: ${pdfPath}`);
    process.exit(1);
  }
  
  console.log('📄 Processando PDF:', pdfPath);
  console.log('');
  
  try {
    // 1. Extrair texto
    console.log('🔍 Extraindo texto do PDF...');
    const text = await extractTextFromPDF(pdfPath);
    console.log(`✅ Texto extraído: ${text.length} caracteres`);
    console.log('');
    
    // 2. Parsear transações
    console.log('🔍 Parseando transações...');
    const transactions = parseTransactionsFromText(text);
    console.log(`✅ ${transactions.length} transações encontradas`);
    console.log('');
    
    if (transactions.length === 0) {
      console.log('⚠️  Nenhuma transação encontrada.');
      console.log('');
      console.log('📋 Primeiras 10 linhas do texto:');
      text.split('\n').slice(0, 10).forEach((line, i) => {
        console.log(`   ${i + 1}: ${line.substring(0, 100)}`);
      });
      process.exit(0);
    }
  
    // 3. Mostrar preview
    console.log('📋 Preview das transações:');
    transactions.slice(0, 5).forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.date} | ${t.description.substring(0, 40)} | ${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)}`);
    });
    console.log('');
    
    // 4. Se não forneceu user_id e account_id, apenas mostrar
    if (!userId || !accountId) {
      console.log('ℹ️  Para enviar para a base de dados, forneça user_id e account_id:');
      console.log(`   node scripts/process-pdf.js "${pdfPath}" <user_id> <account_id>`);
      console.log('');
      console.log('💾 Transações salvas em: transactions.json');
      fs.writeFileSync('transactions.json', JSON.stringify(transactions, null, 2));
      process.exit(0);
    }
    
    // 5. Verificar se Supabase está configurado
    if (!supabase) {
      console.error('❌ Erro: Supabase não está configurado.');
      console.log('   Configure as variáveis de ambiente no arquivo .env');
      process.exit(1);
    }
    
    // 6. Enviar para Supabase
    console.log('💾 Enviando transações para Supabase...');
    console.log(`   User ID: ${userId}`);
    console.log(`   Account ID: ${accountId}`);
    console.log('');
    
    const transactionsToInsert = transactions.map(t => ({
      user_id: userId,
      account_id: accountId,
      description: t.description,
      merchant: t.merchant || t.description,
      amount: t.amount,
      transaction_type: t.amount >= 0 ? 'receita' : 'despesa',
      transaction_date: t.date,
      status: 'confirmed',
      source: 'pdf_import',
    }));
    
    // Inserir em lotes de 50
    const batchSize = 50;
    let inserted = 0;
    let errors = 0;
    
    for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
      const batch = transactionsToInsert.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('transactions')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Erro ao inserir lote ${Math.floor(i / batchSize) + 1}:`, error.message);
        errors++;
      } else {
        inserted += data?.length || 0;
        console.log(`✅ Lote ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} transações inseridas`);
      }
    }
    
    console.log('');
    console.log('✅ Processamento concluído!');
    console.log(`   Total: ${transactions.length} transações`);
    console.log(`   Inseridas: ${inserted}`);
    console.log(`   Erros: ${errors}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();

