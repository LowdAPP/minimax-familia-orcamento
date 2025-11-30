const { describe, it } = require('node:test');
const assert = require('node:assert');

// Copiando a função parseAmount do server.js
function parseAmount(amountStr) {
  if (!amountStr) return null;
  
  // Remove espaços e caracteres especiais, exceto números, vírgula e ponto
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

console.log('--- Teste de Parse de Valor ---');
console.log('Input: "-67.77"');
console.log('Output:', parseAmount("-67.77"));

console.log('\nInput: "1.000,00"');
console.log('Output:', parseAmount("1.000,00"));

console.log('\nInput: "1,000.00"');
console.log('Output:', parseAmount("1,000.00"));

console.log('\nInput: "1.234" (Ambiguidade: 1 mil e duzentos ou 1 ponto 234?)');
console.log('Output:', parseAmount("1.234"));

// Testando regex para capturar a linha mencionada
// Padrão mencionado: -11-2025,24-11-2025,Lidl Montijo,-67.77
const line = "24-11-2025,24-11-2025,Lidl Montijo,-67.77";

// Regex genérico que temos no server.js
const regexes = [
  /(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\+\-]?\s*\d{1,3}(?:\.\d{3})*,\d{2})\s*EUR/gi,
  /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s+(.+?)\s+([\+\-]?\s*\d{1,10}(?:[.,]\d{3})*[.,]\d{2})\s*(?:EUR|€|R\$|\$)?/gi
];

console.log(`\n--- Teste de Regex na linha: "${line}" ---`);

regexes.forEach((regex, index) => {
  const match = line.match(regex);
  console.log(`Regex ${index + 1}: ${match ? 'Casou!' : 'Não casou'}`);
  if (match) {
    const exec = regex.exec(line); // Reset lastIndex se global
    if (exec) console.log('Capturas:', exec);
  }
});

