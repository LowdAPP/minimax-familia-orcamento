#!/usr/bin/env node

const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

const pdfPath = path.join(__dirname, '../../docs/SantanderPessoal.pdf');

if (!fs.existsSync(pdfPath)) {
  console.error('❌ Arquivo PDF não encontrado:', pdfPath);
  process.exit(1);
}

console.log('📄 Analisando PDF:', pdfPath);
console.log('⏳ Aguarde...\n');

const dataBuffer = fs.readFileSync(pdfPath);

pdfParse(dataBuffer).then(data => {
  console.log('='.repeat(80));
  console.log('📊 ESTATÍSTICAS DO PDF');
  console.log('='.repeat(80));
  console.log(`Total de páginas: ${data.numpages}`);
  console.log(`Total de caracteres: ${data.text.length}`);
  console.log(`Total de linhas: ${data.text.split('\n').length}`);
  
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  console.log(`Linhas não vazias: ${lines.length}`);
  
  console.log('\n' + '='.repeat(80));
  console.log('📝 PRIMEIRAS 50 LINHAS');
  console.log('='.repeat(80));
  lines.slice(0, 50).forEach((line, i) => {
    console.log(`${String(i + 1).padStart(3, ' ')}: ${line}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('📝 ÚLTIMAS 30 LINHAS');
  console.log('='.repeat(80));
  lines.slice(-30).forEach((line, i) => {
    console.log(`${String(lines.length - 30 + i + 1).padStart(3, ' ')}: ${line}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ANÁLISE DE PADRÕES');
  console.log('='.repeat(80));
  
  // Procurar por padrões de data
  const datePatterns = [
    /\d{2}-\d{2}-\d{4}/g,
    /\d{2}\/\d{2}\/\d{4}/g,
    /\d{1,2}-\d{1,2}-\d{2,4}/g,
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g
  ];
  
  datePatterns.forEach((pattern, idx) => {
    const matches = data.text.match(pattern);
    if (matches && matches.length > 0) {
      console.log(`\nPadrão de data ${idx + 1} (${pattern}): ${matches.length} ocorrências`);
      console.log(`  Exemplos: ${matches.slice(0, 5).join(', ')}`);
    }
  });
  
  // Procurar por padrões de valor
  const amountPatterns = [
    /[\+\-]?\s*\d{1,3}(?:\.\d{3})*,\d{2}\s*EUR/g,
    /[\+\-]?\s*\d{1,10}(?:[.,]\d{3})*[.,]\d{2}/g
  ];
  
  amountPatterns.forEach((pattern, idx) => {
    const matches = data.text.match(pattern);
    if (matches && matches.length > 0) {
      console.log(`\nPadrão de valor ${idx + 1} (${pattern}): ${matches.length} ocorrências`);
      console.log(`  Exemplos: ${matches.slice(0, 5).join(', ')}`);
    }
  });
  
  // Procurar linhas que parecem ser transações
  console.log('\n' + '='.repeat(80));
  console.log('💰 EXEMPLOS DE LINHAS QUE PARECEM TRANSAÇÕES');
  console.log('='.repeat(80));
  
  const transactionLikeLines = lines.filter(line => {
    const hasDate = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(line);
    const hasAmount = /[\+\-]?\s*\d{1,10}(?:[.,]\d{3})*[.,]\d{2}/.test(line);
    const hasText = /[a-zA-Z]{3,}/.test(line);
    return hasDate && (hasAmount || hasText);
  });
  
  transactionLikeLines.slice(0, 20).forEach((line, i) => {
    console.log(`${String(i + 1).padStart(3, ' ')}: ${line.substring(0, 120)}`);
  });
  
  console.log(`\nTotal de linhas que parecem transações: ${transactionLikeLines.length}`);
  
}).catch(err => {
  console.error('❌ Erro ao processar PDF:', err);
  process.exit(1);
});

