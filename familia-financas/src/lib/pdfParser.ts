/**
 * PDF Parser para processar extratos bancários no browser
 * Usa pdfjs-dist para extrair texto e parsear transações
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configurar worker do pdfjs para funcionar no browser
if (typeof window !== 'undefined') {
  // Usar CDN do pdfjs (mais confiável que tentar servir localmente)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface Transaction {
  date: string;
  description: string;
  amount: number;
  merchant?: string;
}

/**
 * Extrai texto de um PDF usando pdfjs-dist
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({
      data: pdfBytes,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;

    let fullText = '';

    // Extrair texto de cada página
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Concatenar todos os itens de texto
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');

      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error: any) {
    console.error('Erro ao extrair texto do PDF:', error);
    throw new Error(`Falha na extração de texto: ${error.message}`);
  }
}

/**
 * Parse transações do texto extraído
 * Suporta formato de extratos bancários portugueses
 */
export function parseTransactionsFromText(text: string): Transaction[] {
  const transactions: Transaction[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Padrão de data (pode aparecer duplicada: DD-MM-YYYYDD-MM-YYYY)
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;

  // Padrão de valor com qualquer moeda (formato: - 123,45 EUR/R$/USD/$ ou + 123,45)
  // Aceita: EUR, €, R$, $, USD ou sem símbolo
  const amountPattern = /([\+\-])\s*(\d{1,10}(?:[.,]\d{3})*[.,]\d{2})\s*(?:EUR|€|R\$|\$|USD)?/gi;

  // Processar linha por linha
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Verificar se a linha tem data
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;

    // Pular cabeçalhos
    if (line.includes('DataTipoDescritivo') || line.includes('Saldo contabilístico')) continue;

    // Extrair data
    const dateStr = dateMatch[1];
    const date = parseDate(dateStr);
    if (!date) continue;

    // Formato típico: linha com data, próxima linha com descrição, próxima com valor
    let description = '';
    let amount: number | null = null;

    // Se a linha tem só data (ou data duplicada), descrição está na próxima linha
    const lineAfterDate = line.substring(line.indexOf(dateStr) + dateStr.length).trim();
    // Verificar se há texto descritivo (não só números, moedas e símbolos)
    const hasDescriptionInLine = lineAfterDate.length > 3 && !/^[\d\s\-EUR€R\$£\$USD]+$/.test(lineAfterDate);

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
      .replace(/(?:EUR|€|R\$|\$|USD)\d+[.,]\d+(?:EUR|€|R\$|\$|USD)?/g, '') // Remover saldos que ficaram na descrição
      .trim();

    // Validar
    if (!amount || isNaN(amount) || Math.abs(amount) < 0.01) continue;
    if (description.length < 3 || description.length > 150) continue;
    // Verificar se descrição não é só números, moedas e símbolos
    if (/^[\d\s\.\,\-\/\+€\$£EURR\$USD]+$/.test(description)) continue;

    // Filtrar cabeçalhos
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('disponível') || lowerDesc.includes('autorizado')) continue;
    if (lowerDesc.includes('movimentos') && lowerDesc.includes('conta')) continue;

    // Verificar duplicata
    const isDuplicate = transactions.some(t =>
      t.date === date &&
      Math.abs(t.amount - amount!) < 0.01 &&
      t.description === description
    );

    if (!isDuplicate) {
      transactions.push({
        date,
        description,
        amount: amount!,
        merchant: extractMerchant(description),
      });
    }
  }

  return transactions;
}

// Converter data para formato ISO
function parseDate(dateStr: string): string | null {
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
function parseAmount(amountStr: string): number {
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
function extractMerchant(description: string): string {
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

