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
      console.log('⚠️ DEBUG - Nenhuma transação encontrada');
      console.log('📄 Tamanho do texto extraído:', pdfText.length, 'caracteres');
      console.log('📄 Primeiros 2000 caracteres do texto:');
      console.log('='.repeat(80));
      console.log(pdfText.substring(0, 2000));
      console.log('='.repeat(80));
      
      // Tentar encontrar padrões de data e valor no texto
      const dateMatches = pdfText.match(/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/g) || [];
      const amountMatches = pdfText.match(/[\d.,]+\s*[€$£EUR]|[\d.,]+\s*R\$|[\d.,]+\s*EUR/gi) || [];
      
      console.log('📅 Datas encontradas no texto:', dateMatches.slice(0, 10));
      console.log('💰 Valores encontrados no texto:', amountMatches.slice(0, 10));
      
      // Procurar linhas que podem ser transações
      const lines = pdfText.split('\n').filter(l => l.trim().length > 10);
      const potentialTransactionLines = lines.filter(line => {
        const hasDate = /\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/.test(line);
        const hasAmount = /[\d.,]+\s*[€$£EUR]|[\d.,]+\s*R\$/.test(line);
        return hasDate && hasAmount;
      });
      
      console.log('📋 Linhas que parecem transações:', potentialTransactionLines.slice(0, 5));
      
      return errorResponse(corsHeaders, 'NO_TRANSACTIONS', 
        `Nenhuma transação foi encontrada no PDF. Formato detectado: ${parseResult.bankFormat || 'Desconhecido'}. ` +
        'Certifique-se de que o arquivo é um extrato bancário válido com transações visíveis. ' +
        `Texto extraído: ${pdfText.length} caracteres. Verifique os logs para mais detalhes.`
      );
    }

    // 6. Salvar no banco de dados
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return errorResponse(corsHeaders, 'SERVER_CONFIG', 'Erro de configuração do servidor');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validar UUIDs antes de inserir
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(userId)) {
      return errorResponse(corsHeaders, 'INVALID_USER_ID', 
        `user_id inválido: "${userId}". Deve ser um UUID válido.`
      );
    }
    
    if (!uuidRegex.test(accountId)) {
      return errorResponse(corsHeaders, 'INVALID_ACCOUNT_ID', 
        `account_id inválido: "${accountId}". Deve ser um UUID válido.`
      );
    }

    // Validar e preparar transações para inserção
    const transactionsToInsert = parseResult.transactions.map((t: any) => {
      // Validar data
      if (!t.date || !/^\d{4}-\d{2}-\d{2}$/.test(t.date)) {
        throw new Error(`Data inválida: ${t.date}. Deve estar no formato YYYY-MM-DD.`);
      }
      
      // Validar valor
      if (isNaN(t.amount) || !isFinite(t.amount)) {
        throw new Error(`Valor inválido: ${t.amount}`);
      }

      return {
        user_id: userId,
        account_id: accountId,
        description: t.description || 'Transação sem descrição',
        merchant: t.merchant || t.description || null,
        amount: parseFloat(t.amount.toFixed(2)),
        transaction_type: t.amount >= 0 ? 'receita' : 'despesa',
        transaction_date: t.date,
        status: 'confirmed',
        source: 'pdf_import',
        // category_id é opcional, não incluímos aqui
      };
    });

    console.log('💾 Salvando', transactionsToInsert.length, 'transações no banco...');
    if (transactionsToInsert.length > 0) {
      console.log('📋 Primeira transação de exemplo:', JSON.stringify(transactionsToInsert[0], null, 2));
    }

    // Inserir todas as transações em lote
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select();

    if (error) {
      console.error('❌ Erro ao inserir no banco:', error);
      console.error('❌ Detalhes do erro:', JSON.stringify(error, null, 2));
      console.error('❌ Primeira transação que causou erro:', JSON.stringify(transactionsToInsert[0], null, 2));
      
      // Mensagem de erro mais detalhada
      let errorMessage = `Erro ao salvar transações no banco de dados: ${error.message}`;
      if (error.code) {
        errorMessage += ` (código: ${error.code})`;
      }
      if (error.details) {
        errorMessage += ` Detalhes: ${error.details}`;
      }
      if (error.hint) {
        errorMessage += ` Dica: ${error.hint}`;
      }
      
      return errorResponse(corsHeaders, 'DATABASE_ERROR', errorMessage);
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
    
    // Método 2: Extrair strings PDF (formato padrão) - strings entre parênteses
    const stringPattern = /\((.*?)\)/g;
    const strings: string[] = [];
    let match;
    
    while ((match = stringPattern.exec(text)) !== null) {
      if (match[1] && match[1].length > 0) {
        // Decodificar escape sequences comuns
        let decoded = match[1]
          .replace(/\\n/g, ' ')
          .replace(/\\r/g, ' ')
          .replace(/\\t/g, ' ')
          .replace(/\\\(/g, '(')
          .replace(/\\\)/g, ')')
          .replace(/\\\\/g, '\\');
        strings.push(decoded);
      }
    }
    
    let extractedText = strings.join(' ');
    
    // Método 3: Extrair também strings entre colchetes [text]
    const bracketPattern = /\[(.*?)\]/g;
    const bracketStrings: string[] = [];
    while ((match = bracketPattern.exec(text)) !== null) {
      if (match[1] && match[1].length > 0 && match[1].length < 200) {
        bracketStrings.push(match[1]);
      }
    }
    
    if (bracketStrings.length > 0) {
      extractedText += ' ' + bracketStrings.join(' ');
    }
    
    // Método 4: Se não extraiu suficiente, tentar extração raw de caracteres legíveis
    if (extractedText.length < 100) {
      console.log('⚠️ Pouco texto via strings, tentando extração raw...');
      // Procurar por sequências de caracteres alfanuméricos e espaços
      const rawPattern = /[A-Za-zÀ-ÿ0-9\s\-\.\,\/\+\€\$\£\(\)\[\]]{3,}/g;
      const rawMatches = text.match(rawPattern) || [];
      const rawText = rawMatches.join(' ');
      if (rawText.length > extractedText.length) {
        extractedText = rawText;
      }
    }
    
    // Método 5: Extrair texto de streams PDF (formato mais complexo)
    const streamPattern = /stream\s*([\s\S]*?)\s*endstream/gi;
    const streams: string[] = [];
    while ((match = streamPattern.exec(text)) !== null) {
      if (match[1]) {
        // Tentar decodificar o stream
        const streamText = match[1]
          .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (streamText.length > 10 && /[A-Za-z]/.test(streamText)) {
          streams.push(streamText);
        }
      }
    }
    
    if (streams.length > 0 && extractedText.length < 500) {
      extractedText += ' ' + streams.join(' ');
    }
    
    // Limpar caracteres de controle e normalizar espaços
    extractedText = extractedText
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('📝 Extração:', {
      strings: strings.length,
      bracketStrings: bracketStrings.length,
      streams: streams.length,
      totalChars: extractedText.length,
      sample: extractedText.substring(0, 200)
    });
    
    return extractedText;
    
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
    },
    {
      name: 'Formato Tabela - Data | Descrição | Valor',
      // Data | Descrição | Valor (com separadores de tabela)
      regex: /(\d{2}[\-\/]\d{2}[\-\/]\d{2,4})\s*[|\t]\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\s\.\-\/]{2,80}?)\s*[|\t]\s*([\-\+]?\d{1,10}(?:[.,]\d{3})*[.,]\d{2})\s*(?:EUR|€|R\$|\$)?/gi,
      dateGroup: 1,
      descGroup: 2,
      amountGroup: 3
    },
    {
      name: 'Formato Extrato Empresa - Múltiplas Colunas',
      // Data Descrição Valor (formato mais flexível)
      regex: /(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4})\s+([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s\.\-\/\(\)]{3,100}?)\s+([\-\+]?\d{1,10}(?:[.,]\d{3})*[.,]\d{2})\s*(?:EUR|€|R\$|\$|USD)?/gi,
      dateGroup: 1,
      descGroup: 2,
      amountGroup: 3
    },
    {
      name: 'Formato com Espaços Múltiplos',
      // Data    Descrição    Valor (com múltiplos espaços)
      regex: /(\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4})\s{2,}([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s\.\-\/]{3,100}?)\s{2,}([\-\+]?\d{1,10}(?:[.,]\d{3})*[.,]\d{2})/gi,
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
