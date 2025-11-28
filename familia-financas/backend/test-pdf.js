#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Copiar funções do server.js
function parseDate(dateStr) {
  if (!dateStr) return null;
  dateStr = dateStr.trim().replace(/\s+/g, '');
  const match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!match) return null;
  
  let day = parseInt(match[1], 10);
  let month = parseInt(match[2], 10);
  let year = parseInt(match[3], 10);
  
  if (year < 100) {
    year = year < 50 ? 2000 + year : 1900 + year;
  }
  
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseAmount(amountStr) {
  if (!amountStr) return null;
  
  // Remove espaços e caracteres especiais, exceto números, vírgula e ponto
  // Primeiro remove espaços (usados como separador de milhares em formato PT)
  let cleaned = amountStr.toString().trim().replace(/\s/g, '').replace(/[^\d,.-]/g, '');
  
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    if (cleaned.split(',')[1]?.length === 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(',', '');
    }
  }
  
  const value = parseFloat(cleaned);
  return isNaN(value) ? null : Math.abs(value);
}

function extractMerchant(description) {
  if (!description) return null;
  const cleaned = description.trim().replace(/\s+/g, ' ');
  const words = cleaned.split(' ');
  if (words.length > 0) {
    return words.slice(0, 3).join(' ').substring(0, 200);
  }
  return cleaned.substring(0, 200);
}

function parseTransactionsFromText(text, userId = 'test', accountId = 'test') {
  const transactions = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  console.log(`\n📄 Analisando ${lines.length} linhas de texto...`);
  console.log(`📝 Primeiras 10 linhas:`);
  lines.slice(0, 10).forEach((line, i) => {
    console.log(`   ${i + 1}: ${line.substring(0, 100)}`);
  });

  // Múltiplos padrões para diferentes formatos de extrato
  const patterns = [
    {
      name: 'Santander PT - Data Duplicada Sem Espaço',
      isLineByLine: true
    },
    {
      name: 'Santander PT - Data Duplicada',
      regex: /(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\+\-]?\s*\d{1,3}(?:\.\d{3})*,\d{2})\s*EUR/gi
    },
    {
      name: 'Formato com Data Duplicada e Barra',
      regex: /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\+\-]?\s*\d{1,3}(?:\.\d{3})*,\d{2})\s*EUR/gi
    },
    {
      name: 'Formato Simples - Data Descrição Valor',
      regex: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([\+\-]?\s*\d{1,10}(?:[.,]\d{3})*[.,]\d{2})\s*(?:EUR|€|R\$|\$)/gi
    },
    {
      name: 'Formato Tabela',
      regex: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*[|\t]\s*(.+?)\s*[|\t]\s*([\+\-]?\s*\d{1,10}(?:[.,]\d{3})*[.,]\d{2})/gi
    }
  ];

  // Tenta cada padrão
  for (const pattern of patterns) {
    console.log(`\n🔍 Tentando padrão: ${pattern.name}`);
    
    // Padrão especial: Data duplicada sem espaço (formato linha por linha)
    if (pattern.isLineByLine && pattern.name === 'Santander PT - Data Duplicada Sem Espaço') {
      const dateDuplicatedPattern = /^(\d{2}-\d{2}-\d{4})(\d{2}-\d{2}-\d{4})$/;
      const amountPattern = /([\+\-]?)\s*(\d{1,3}(?:\s*\d{3})*,\d{2})\s*EUR/;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const dateMatch = line.match(dateDuplicatedPattern);
        
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const transactionDate = parseDate(dateStr);
          
          if (!transactionDate) continue;
          
          if (i + 1 >= lines.length) continue;
          let description = lines[i + 1].trim();
          
          if (i + 2 >= lines.length) continue;
          const amountLine = lines[i + 2].trim();
          const amountMatch = amountLine.match(amountPattern);
          
          if (!amountMatch) continue;
          
          const sign = amountMatch[1] === '+' ? 1 : -1;
          const amountValue = parseAmount(amountMatch[2]);
          
          if (!amountValue || amountValue < 0.01) continue;
          
          const amount = sign * amountValue;
          
          description = description
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[|\t]/g, ' ')
            .trim();
          
          if (description.length < 3 || description.length > 500) continue;
          if (/^[\d\s\.\,\-\/\+€\$£EURR\$USD]+$/.test(description)) continue;
          
          const lowerDesc = description.toLowerCase();
          if (lowerDesc.includes('disponível') || 
              lowerDesc.includes('autorizado') ||
              lowerDesc.includes('saldo contabilístico') ||
              (lowerDesc.includes('data') && lowerDesc.includes('tipo'))) {
            continue;
          }
          
          const isDuplicate = transactions.some(t =>
            t.transaction_date === transactionDate &&
            Math.abs(t.amount - amount) < 0.01 &&
            t.description === description
          );
          
          if (!isDuplicate) {
            console.log(`\n   ✅ Transação encontrada:`);
            console.log(`      Data: ${transactionDate}`);
            console.log(`      Descrição: ${description.substring(0, 60)}`);
            console.log(`      Valor: ${amount > 0 ? '+' : ''}${amount.toFixed(2)}`);
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
          
          i += 2;
        }
      }
      
      if (transactions.length > 0) {
        console.log(`\n✅ Usando padrão ${pattern.name} - ${transactions.length} transações encontradas`);
        break;
      }
      continue;
    }
    
    const textToSearch = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    let matchCount = 0;
    const allMatches = [];

    for (const match of textToSearch.matchAll(pattern.regex)) {
      matchCount++;
      allMatches.push(match[0]);
      
      try {
        let dateStr, description, amountStr;

        if (pattern.name.includes('Duplicada')) {
          dateStr = match[1];
          description = match[3];
          amountStr = match[4];
        } else {
          dateStr = match[1];
          description = match[2];
          amountStr = match[3];
        }

        console.log(`\n   Match ${matchCount}:`);
        console.log(`      Data: "${dateStr}"`);
        console.log(`      Descrição: "${description.substring(0, 60)}"`);
        console.log(`      Valor: "${amountStr}"`);

        const transactionDate = parseDate(dateStr);
        if (!transactionDate) {
          console.log(`      ⚠️ Data inválida: ${dateStr}`);
          continue;
        }

        const amountValue = parseAmount(amountStr);
        if (!amountValue || amountValue < 0.01) {
          console.log(`      ⚠️ Valor inválido: ${amountStr}`);
          continue;
        }

        let amount = amountValue;
        if (amountStr.trim().startsWith('+')) {
          amount = amountValue;
        } else if (amountStr.trim().startsWith('-')) {
          amount = -amountValue;
        } else {
          amount = -amountValue;
        }

        description = description
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/[|\t]/g, ' ')
          .replace(/(?:EUR|€|R\$|\$|USD)\d+[.,]\d+(?:EUR|€|R\$|\$|USD)?/g, '')
          .trim();

        if (description.length < 3 || description.length > 500) {
          console.log(`      ⚠️ Descrição muito curta/longa: ${description.substring(0, 50)}`);
          continue;
        }

        if (/^[\d\s\.\,\-\/\+€\$£EURR\$USD]+$/.test(description)) {
          console.log(`      ⚠️ Descrição só tem números: ${description}`);
          continue;
        }

        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('disponível') || 
            lowerDesc.includes('autorizado') ||
            lowerDesc.includes('saldo contabilístico') ||
            lowerDesc.includes('data') && lowerDesc.includes('tipo')) {
          console.log(`      ⚠️ Descrição filtrada (cabeçalho/rodapé)`);
          continue;
        }

        const isDuplicate = transactions.some(t =>
          t.transaction_date === transactionDate &&
          Math.abs(t.amount - amount) < 0.01 &&
          t.description === description
        );

        if (!isDuplicate) {
          console.log(`      ✅ Transação válida!`);
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
        } else {
          console.log(`      ⚠️ Duplicata ignorada`);
        }
      } catch (error) {
        console.log(`      ❌ Erro ao processar match:`, error.message);
        continue;
      }
    }

    console.log(`\n   📊 Padrão ${pattern.name}: ${matchCount} matches encontrados`);
    if (allMatches.length > 0) {
      console.log(`   📋 Primeiros 3 matches completos:`);
      allMatches.slice(0, 3).forEach((m, i) => {
        console.log(`      ${i + 1}: ${m.substring(0, 100)}`);
      });
    }
    
    if (transactions.length > 0) {
      console.log(`\n✅ Usando padrão ${pattern.name} - ${transactions.length} transações encontradas`);
      break;
    }
  }

  // Se não encontrou com padrões, tenta método linha por linha (fallback)
  if (transactions.length === 0) {
    console.log(`\n🔄 Nenhuma transação encontrada com padrões, tentando método linha por linha...`);
    
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

  console.log(`\n✅ Total de ${transactions.length} transações parseadas`);
  return transactions;
}

// Função principal
async function main() {
  const pdfPath = path.join(__dirname, 'docs', 'ReceitasEmpresas.pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ Arquivo não encontrado: ${pdfPath}`);
    process.exit(1);
  }

  console.log('='.repeat(80));
  console.log('📊 TESTE DE PROCESSAMENTO DE PDF');
  console.log('='.repeat(80));
  console.log(`\n📄 Arquivo: ${pdfPath}`);
  console.log(`📏 Tamanho: ${(fs.statSync(pdfPath).size / 1024).toFixed(2)} KB\n`);

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log('📖 Processando PDF...\n');
    
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;

    console.log(`✅ PDF parseado:`);
    console.log(`   - Páginas: ${pdfData.numpages}`);
    console.log(`   - Caracteres: ${text.length}`);
    console.log(`   - Linhas: ${text.split('\n').length}`);

    // Salvar texto extraído para análise
    const textOutputPath = path.join(__dirname, 'extracted_text.txt');
    fs.writeFileSync(textOutputPath, text, 'utf-8');
    console.log(`\n💾 Texto extraído salvo em: ${textOutputPath}`);

    // Mostrar amostra do texto
    console.log(`\n📝 Primeiros 2000 caracteres do texto:`);
    console.log('-'.repeat(80));
    console.log(text.substring(0, 2000));
    console.log('-'.repeat(80));

    // Procurar por padrões de data e valor
    console.log(`\n🔍 Buscando padrões no texto...`);
    const dateMatches = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g) || [];
    const amountMatches = text.match(/[\+\-]?\s*\d{1,10}(?:[.,]\d{3})*[.,]\d{2}/g) || [];
    console.log(`   - Datas encontradas: ${dateMatches.length} (primeiras 10: ${dateMatches.slice(0, 10).join(', ')})`);
    console.log(`   - Valores encontrados: ${amountMatches.length} (primeiros 10: ${amountMatches.slice(0, 10).join(', ')})`);

    // Parsear transações
    const transactions = parseTransactionsFromText(text);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📊 RESULTADO FINAL`);
    console.log(`${'='.repeat(80)}`);
    console.log(`\n✅ Total de transações encontradas: ${transactions.length}\n`);

    if (transactions.length > 0) {
      console.log('📋 Transações encontradas:');
      transactions.forEach((t, i) => {
        console.log(`\n   ${i + 1}. ${t.transaction_date} | ${t.transaction_type.toUpperCase()}`);
        console.log(`      Descrição: ${t.description}`);
        console.log(`      Merchant: ${t.merchant || 'N/A'}`);
        console.log(`      Valor: ${t.amount > 0 ? '+' : ''}${t.amount.toFixed(2)}`);
      });
    } else {
      console.log('⚠️  Nenhuma transação foi encontrada!');
      console.log('\n💡 Dicas para debug:');
      console.log('   1. Verifique o arquivo extracted_text.txt para ver o texto completo');
      console.log('   2. Verifique se o formato do PDF corresponde aos padrões esperados');
      console.log('   3. Verifique se há datas e valores no formato esperado');
    }

  } catch (error) {
    console.error(`\n❌ Erro ao processar PDF:`, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

