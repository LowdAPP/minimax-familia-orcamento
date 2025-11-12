// Edge Function: PDF Parser V9 - MULTI-BANCO ROBUSTO
// Suporta: Santander PT, CGD, Millennium BCP, Bancos BR e formatos genéricos

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log('=== PDF Parser V9 - Multi-Banco ===');
    
    // 1. Validar FormData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('user_id') as string;
    const accountId = formData.get('account_id') as string;

    if (!file) {
      return errorResponse(corsHeaders, 'MISSING_FILE', 'Arquivo PDF não foi enviado');
    }
    if (!userId || !accountId) {
      return errorResponse(corsHeaders, 'MISSING_PARAMS', 'user_id e account_id são obrigatórios');
    }

    console.log('📄 Arquivo:', file.name, `${(file.size / 1024).toFixed(2)} KB`);

    // 2. Validar tipo de arquivo
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return errorResponse(corsHeaders, 'INVALID_FILE_TYPE', 'O arquivo deve ser um PDF válido');
    }

    // 3. Ler PDF
    const pdfBytes = new Uint8Array(await file.arrayBuffer());
    console.log('✓ PDF carregado:', pdfBytes.length, 'bytes');
    
    // 4. Extrair texto
    const pdfText = extractTextFromPDF(pdfBytes);
    
    if (!pdfText || pdfText.length < 50) {
      return errorResponse(corsHeaders, 'EXTRACTION_FAILED', 
        'Não foi possível extrair texto do PDF. O arquivo pode estar corrompido, protegido por senha ou ser uma imagem escaneada.'
      );
    }
    
    console.log('✓ Texto extraído:', pdfText.length, 'caracteres');
    
    // 5. Detectar formato e parsear transações
    const parseResult = parseTransactionsFromText(pdfText);
    console.log('✓ Banco detectado:', parseResult.bankFormat);
    console.log('✓ Transações encontradas:', parseResult.transactions.length);

    if (parseResult.transactions.length === 0) {
      console.log('⚠️ DEBUG - Amostra do texto extraído:');
      console.log(pdfText.substring(0, 500));
      
      return errorResponse(corsHeaders, 'NO_TRANSACTIONS', 
        `Nenhuma transação foi encontrada no PDF. Formato detectado: ${parseResult.bankFormat || 'Desconhecido'}. ` +
        'Certifique-se de que o arquivo é um extrato bancário válido com transações visíveis.'
      );
    }

    // 6. Salvar no banco de dados
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return errorResponse(corsHeaders, 'SERVER_CONFIG', 'Erro de configuração do servidor');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const transactionsToInsert = parseResult.transactions.map((t: any) => ({
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

    console.log('💾 Salvando', transactionsToInsert.length, 'transações no banco...');

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select();

    if (error) {
      console.error('❌ Erro ao inserir no banco:', error);
      return errorResponse(corsHeaders, 'DATABASE_ERROR', 
        `Erro ao salvar transações no banco de dados: ${error.message}`
      );
    }

    console.log('✅ SUCESSO!', data?.length || 0, 'transações salvas');

    return new Response(
      JSON.stringify({
        success: true,
        transactionsInserted: data?.length || 0,
        message: `PDF processado com sucesso! ${data?.length} transações importadas.`,
        bankFormat: parseResult.bankFormat,
        parseMethod: 'multi_bank_v9',
        preview: transactionsToInsert.slice(0, 5).map(t => ({
          date: t.transaction_date,
          description: t.description,
          amount: `${t.amount} EUR`
        }))
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Erro inesperado:', error.message, error.stack);
    return errorResponse(corsHeaders, 'UNEXPECTED_ERROR', 
      `Erro inesperado ao processar PDF: ${error.message}`
    );
  }
});

// Função auxiliar para respostas de erro padronizadas
function errorResponse(corsHeaders: any, errorCode: string, errorMessage: string) {
  return new Response(
    JSON.stringify({
      success: false,
      errorCode: errorCode,
      error: errorMessage,
      transactionsInserted: 0,
      suggestion: getErrorSuggestion(errorCode)
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    }
  );
}

// Sugestões contextuais para cada tipo de erro
function getErrorSuggestion(errorCode: string): string {
  const suggestions: { [key: string]: string } = {
    'MISSING_FILE': 'Selecione um arquivo PDF do seu extrato bancário.',
    'MISSING_PARAMS': 'Erro técnico. Por favor, tente novamente.',
    'INVALID_FILE_TYPE': 'Por favor, envie apenas arquivos PDF.',
    'EXTRACTION_FAILED': 'Tente exportar o extrato novamente do site do banco ou use um formato diferente.',
    'NO_TRANSACTIONS': 'Verifique se o PDF contém transações visíveis (não imagens escaneadas).',
    'DATABASE_ERROR': 'Erro ao salvar. Por favor, tente novamente.',
    'SERVER_CONFIG': 'Erro no servidor. Contacte o suporte.',
    'UNEXPECTED_ERROR': 'Erro inesperado. Por favor, tente novamente ou contacte o suporte.'
  };
  return suggestions[errorCode] || 'Tente novamente ou contacte o suporte.';
}

// =====================================================
// Extração de texto robusta
// =====================================================
function extractTextFromPDF(pdfBytes: Uint8Array): string {
  try {
    // Método 1: Decodificar como UTF-8
    let text = new TextDecoder('utf-8', { fatal: false }).decode(pdfBytes);
    
    // Método 2: Extrair strings PDF (formato padrão)
    const stringPattern = /\((.*?)\)/g;
    const strings: string[] = [];
    let match;
    
    while ((match = stringPattern.exec(text)) !== null) {
      if (match[1].length > 0) {
        strings.push(match[1]);
      }
    }
    
    let extractedText = strings.join(' ');
    
    // Método 3: Se não extraiu suficiente, tentar extração raw
    if (extractedText.length < 100) {
      console.log('⚠️ Pouco texto via strings, tentando extração raw...');
      const rawPattern = /[A-Za-zÀ-ÿ0-9\s\-\.\,\/\+\€\$\£]+/g;
      const rawMatches = text.match(rawPattern) || [];
      extractedText = rawMatches.join(' ');
    }
    
    // Limpar caracteres de controle
    extractedText = extractedText.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, ' ');
    
    console.log('📝 Extração:', strings.length, 'strings,', extractedText.length, 'chars');
    
    return extractedText.trim();
    
  } catch (error: any) {
    console.error('❌ Erro na extração:', error.message);
    return '';
  }
}

// =====================================================
// Parse multi-banco com detecção automática
// =====================================================
function parseTransactionsFromText(text: string): { transactions: any[], bankFormat: string } {
  const transactions: any[] = [];
  let bankFormat = 'Desconhecido';
  
  console.log('🔍 Iniciando parse multi-banco...');
  
  // Normalizar texto
  const normalized = text.replace(/\s+/g, ' ').trim();
  
  // PATTERNS para diferentes bancos (ordem: mais específico → mais genérico)
  const bankPatterns = [
    {
      name: 'Santander Portugal',
      // DD-MM-YYYY DD-MM-YYYY Descrição Montante EUR Saldo EUR
      regex: /(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+([A-ZÀ-Úa-zà-ú][A-ZÀ-Úa-zà-ú0-9\s\.\-\,\/\(\)]{2,120}?)\s+([\-\+]?\d{1,10}(?:\.\d{3})*,\d{2})\s+EUR\s+[\-\+]?\d{1,10}(?:\.\d{3})*,\d{2}\s+EUR/gi,
      dateGroup: 1,
      descGroup: 3,
      amountGroup: 4
    },
    {
      name: 'Banco PT - Formato Barra',
      // DD/MM/YYYY DD/MM/YYYY Descrição Valor EUR Saldo EUR
      regex: /(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+([A-ZÀ-Úa-zà-ú][A-ZÀ-Úa-zà-ú0-9\s\.\-\,\/]{2,120}?)\s+([\-\+]?\d{1,10}(?:\.\d{3})*,\d{2})\s+EUR/gi,
      dateGroup: 1,
      descGroup: 3,
      amountGroup: 4
    },
    {
      name: 'Banco BR - Formato Padrão',
      // DD/MM/YYYY Descrição R$ Valor
      regex: /(\d{2}\/\d{2}\/\d{4})\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s\.\-]{2,80}?)\s+R?\$?\s*([\-\+]?\d{1,10}(?:\.\d{3})*,\d{2})/gi,
      dateGroup: 1,
      descGroup: 2,
      amountGroup: 3
    },
    {
      name: 'Formato Genérico EUR',
      // DD-MM-YYYY ou DD/MM/YYYY Descrição Valor,XX EUR
      regex: /(\d{2}[\-\/]\d{2}[\-\/]\d{4})\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s\.\-\,]{2,80}?)\s+([\-\+]?\d{1,10}(?:[,\.]\d{2,3})*[,\.]\d{2})\s*(?:EUR|€)?/gi,
      dateGroup: 1,
      descGroup: 2,
      amountGroup: 3
    },
    {
      name: 'Formato Simples',
      // Data Descrição Valor
      regex: /(\d{2}[\-\/]\d{2}[\-\/]\d{4})\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s\.\-]{2,60}?)\s+([\-\+]?\d{1,10}[,\.]\d{2})\b/gi,
      dateGroup: 1,
      descGroup: 2,
      amountGroup: 3
    }
  ];

  // Tentar cada pattern
  for (const pattern of bankPatterns) {
    console.log(`🔎 Testando: ${pattern.name}`);
    
    const matches = [...normalized.matchAll(pattern.regex)];
    console.log(`   → ${matches.length} matches potenciais`);
    
    for (const match of matches) {
      try {
        const dateStr = match[pattern.dateGroup].trim();
        let description = match[pattern.descGroup].trim();
        const amountStr = match[pattern.amountGroup].trim();
        
        // Validações básicas
        if (description.length < 3 || description.length > 150) continue;
        if (/^[\d\s\.\,\-\/\+€\$£]+$/.test(description)) continue; // Só números/símbolos
        
        // Filtrar linhas de cabeçalho e rodapé
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('banco santander') || 
            lowerDesc.includes('©202') ||
            lowerDesc.includes('quinta-feira') ||
            lowerDesc.includes('saldo') && lowerDesc.includes('conta')) {
          continue;
        }
        
        // Limpar e normalizar descrição
        description = description
          .replace(/\s+/g, ' ')
          .replace(/[\x00-\x1F]/g, '')
          .trim();
        
        // Limitar tamanho
        if (description.length > 100) {
          description = description.substring(0, 97) + '...';
        }
        
        // Converter data
        const date = parseDate(dateStr);
        if (!date) {
          console.warn('   ⚠️ Data inválida:', dateStr);
          continue;
        }
        
        // Converter valor
        const amount = parseAmount(amountStr);
        if (isNaN(amount) || Math.abs(amount) < 0.01 || Math.abs(amount) > 999999) {
          console.warn('   ⚠️ Valor inválido:', amountStr);
          continue;
        }
        
        // Verificar duplicata
        const isDuplicate = transactions.some(t => 
          t.date === date && 
          Math.abs(t.amount - amount) < 0.01 && 
          t.description === description
        );
        
        if (!isDuplicate) {
          transactions.push({
            date: date,
            description: description,
            merchant: extractMerchant(description),
            amount: amount
          });
          
          if (transactions.length <= 5) {
            console.log(`   ✓ ${date} | ${description.substring(0, 35)} | ${amount}`);
          }
        }
        
      } catch (error: any) {
        console.warn('   ⚠️ Erro ao processar match:', error.message);
        continue;
      }
    }
    
    if (transactions.length > 0) {
      bankFormat = pattern.name;
      console.log(`✅ Sucesso com "${pattern.name}": ${transactions.length} transações`);
      break;
    }
  }
  
  // Ordenar por data (mais recentes primeiro)
  transactions.sort((a, b) => b.date.localeCompare(a.date));
  
  return { transactions, bankFormat };
}

// Converter data para formato ISO (YYYY-MM-DD)
function parseDate(dateStr: string): string | null {
  // Substituir hífen por barra para normalizar
  const normalized = dateStr.replace(/-/g, '/');
  
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
    const [day, month, year] = normalized.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    // Validar data
    const testDate = new Date(isoDate);
    if (testDate.toString() === 'Invalid Date') return null;
    
    return isoDate;
  }
  
  return null;
}

// Converter valor para número (suporta formatos PT, BR, US)
function parseAmount(amountStr: string): number {
  let cleaned = amountStr.replace(/\s/g, '').replace(/[EUR€R\$£]/gi, '');
  
  const isNegative = cleaned.startsWith('-') || cleaned.includes('(');
  cleaned = cleaned.replace(/[\+\-\(\)]/g, '');
  
  // Detectar formato: último separador define decimal
  // Europeu: 1.234,56 → vírgula é decimal
  // Americano: 1,234.56 → ponto é decimal
  if (cleaned.includes(',') && cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
    // Formato europeu
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
  
  // Pegar primeiras palavras ou limitar a 60 chars
  const words = merchant.split(' ').slice(0, 5).join(' ');
  return words.substring(0, 60);
}
