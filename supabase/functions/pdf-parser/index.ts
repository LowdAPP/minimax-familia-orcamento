// Edge Function: PDF Parser Simplificado
import * as pdfjsLib from 'npm:pdfjs-dist@4.0.379';

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Get Supabase credentials
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Configuração do Supabase ausente');
        }

        // Parse FormData para upload direto
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const user_id = formData.get('user_id') as string;

        if (!file || !user_id) {
            return new Response(JSON.stringify({
                success: false,
                errorCode: 'MISSING_PARAMS',
                error: 'Arquivo PDF e user_id são obrigatórios',
                transactionsInserted: 0
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!file.type.includes('pdf')) {
            return new Response(JSON.stringify({
                success: false,
                errorCode: 'INVALID_FILE',
                error: 'Arquivo deve ser do tipo PDF',
                transactionsInserted: 0
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        console.log('Processando PDF:', { fileName: file.name, user_id, size: file.size });

        // Ler arquivo PDF diretamente
        const pdfBuffer = new Uint8Array(await file.arrayBuffer());
        console.log('PDF processado, tamanho:', pdfBuffer.length, 'bytes');

        // Extrair texto do PDF usando pdfjs-dist
        const extractedText = await extractTextFromPDF(pdfBuffer);
        console.log('Texto extraído, tamanho:', extractedText.length, 'caracteres');

        // Parse transações do texto extraído
        const transactions = parseTransactions(extractedText);
        console.log('Transações encontradas:', transactions.length);

        // Se não encontrou transações, gerar dados do PDF real extraído
        let finalTransactions = transactions;
        
        if (transactions.length === 0) {
            console.log('Usando transações extraídas diretamente do texto');
            finalTransactions = parseFromTextContent(extractedText);
        }

        // Inserir transações no banco de dados usando Supabase
        const insertedTransactions = await insertTransactionsToDatabase(finalTransactions, user_id, supabaseUrl, serviceRoleKey);

        console.log('Processamento concluído:', insertedTransactions.length, 'transações inseridas');

        return new Response(JSON.stringify({
            success: true,
            data: {
                transactions: insertedTransactions,
                transactionCount: insertedTransactions.length,
                extractedTextLength: extractedText.length,
                insertedCount: insertedTransactions.length
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Erro no parsing do PDF:', error);

        return new Response(JSON.stringify({
            success: false,
            errorCode: 'PDF_PARSING_ERROR',
            error: error.message || 'Erro ao processar PDF',
            transactionsInserted: 0
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

/**
 * Extrai texto de um PDF usando pdfjs-dist
 */
async function extractTextFromPDF(pdfBuffer: Uint8Array): Promise<string> {
    try {
        // Carregar documento PDF
        const loadingTask = pdfjsLib.getDocument({
            data: pdfBuffer,
            useSystemFonts: true,
            disableFontFace: true
        });

        const pdfDocument = await loadingTask.promise;
        const numPages = pdfDocument.numPages;
        console.log('PDF tem', numPages, 'páginas');

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

        return fullText;
    } catch (error) {
        console.error('Erro ao extrair texto do PDF:', error);
        throw new Error(`Falha na extração de texto: ${error.message}`);
    }
}

/**
 * Parse transações a partir do conteúdo de texto
 * Suporta múltiplos formatos bancários (Santander PT, etc)
 */
function parseFromTextContent(text: string): Array<any> {
    const transactions = [];

    console.log('====== INICIANDO PARSING ======');
    console.log('Tamanho total do texto:', text.length, 'caracteres');
    console.log('Primeiros 1000 chars:', text.substring(0, 1000));
    console.log('============================');

    // Dividir o texto em linhas e processar
    const lines = text.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);

    console.log(`Total de linhas: ${lines.length}, não-vazias: ${nonEmptyLines.length}`);

    // Mostrar primeiras 10 linhas não-vazias para debug
    console.log('Primeiras 10 linhas não-vazias:');
    nonEmptyLines.slice(0, 10).forEach((line, idx) => {
        console.log(`  ${idx}: "${line}"`);
    });

    for (const line of nonEmptyLines) {
        // Padrão genérico para Santander PT:
        // Data Data Tipo Descritivo Montante Saldo
        // Exemplo: "31-10-2025 31-10-2025 TRF. COBR DUC 105725010361571 - 176,63 EUR 42,71 EUR"

        // Regex mais flexível: (data) (data) (descrição) (valor em EUR)
        const pattern = /(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\+\-]?\s*\d{1,3}[.,]\d{2})\s*EUR/;
        const match = pattern.exec(line);

        if (match) {
            try {
                const [fullMatch, dateStr1, dateStr2, description, amountStr] = match;

                console.log(`📍 MATCH encontrado:`, { fullMatch: fullMatch.substring(0, 100), dateStr1, dateStr2, description: description.substring(0, 50), amountStr });

                // Usar primeira data (é a data da transação)
                const date = normalizeDate(dateStr1.trim());

                // Parse valor
                const amount = parseAmount(amountStr.trim());

                // Limpar descrição - remover espaços extras
                const cleanDescription = description.trim().replace(/\s+/g, ' ');

                // Filtro básico para evitar linhas de cabeçalho/rodapé
                if (cleanDescription.length > 2 &&
                    amount !== 0 &&
                    !cleanDescription.match(/^(Data|Tipo|Montante|Saldo|Total|Movimentos|Empresa|Conta|Disponível|Autorizado)/i)) {

                    console.log('✓ Transação ADICIONADA:', { date, description: cleanDescription, amount });

                    transactions.push({
                        date: date,
                        description: cleanDescription,
                        amount: amount,
                        merchant: extractMerchant(cleanDescription),
                        category: inferCategory(cleanDescription)
                    });
                } else {
                    console.log('⚠️ Transação FILTRADA (falhou validações):', { cleanDescription: cleanDescription.substring(0, 50), amount });
                }
            } catch (error) {
                console.warn('⚠️ Erro ao processar linha:', error, 'Linha:', line.substring(0, 100));
                continue;
            }
        }
    }

    console.log(`\n🔍 RESULTADO: ${transactions.length} transações encontradas\n`);

    // Se não encontrou transações, tentar parsing manual mais agressivo
    if (transactions.length === 0) {
        console.log('Nenhuma transação encontrada com padrão principal. Tentando parsing alternativo...');
        return parseManually(text);
    }

    return transactions;
}

/**
 * Parsing manual para casos onde o regex não funciona
 * Estratégia alternativa e mais agressiva
 */
function parseManually(text: string): Array<any> {
    const transactions = [];
    const processedLines = new Set<string>();

    console.log('\n====== PARSING MANUAL AGRESSIVO ======');

    // Estratégia 1: Procurar por linhas com data + EUR
    const lines = text.split('\n');
    let dateMatchCount = 0;
    let eurMatchCount = 0;

    console.log(`Processando ${lines.length} linhas...`);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (!line || processedLines.has(line)) continue;

        // Procurar por padrão: algo com data e EUR
        const dateMatch = line.match(/(\d{2}-\d{2}-\d{4})/);
        const eurMatch = line.match(/([\+\-]?\s*\d{1,3}[.,]\d{2})\s*EUR/);

        if (dateMatch) dateMatchCount++;
        if (eurMatch) eurMatchCount++;

        if (dateMatch && eurMatch) {
            try {
                const dateStr = dateMatch[1];
                const amountStr = eurMatch[1];

                // Extrair descrição: tudo entre a data e o valor
                const dateIndex = line.indexOf(dateStr);
                const amountIndex = line.indexOf(amountStr);

                let description = 'Transação';
                if (dateIndex !== -1 && amountIndex !== -1 && amountIndex > dateIndex) {
                    // Pegar texto entre a data e o valor
                    let potentialDesc = line.substring(dateIndex + dateStr.length, amountIndex).trim();

                    // Se houver segunda data, pular ela também
                    potentialDesc = potentialDesc.replace(/^\d{2}-\d{2}-\d{4}\s+/, '').trim();

                    if (potentialDesc.length > 2) {
                        description = potentialDesc.replace(/\s+/g, ' ');
                    }
                }

                const date = normalizeDate(dateStr);
                const amount = parseAmount(amountStr);

                // Verificações finais
                if (description.length > 2 &&
                    amount !== 0 &&
                    !description.match(/^(Data|Tipo|Montante|Saldo|Total|Movimentos|Empresa|Conta|Disponível|Autorizado)/i) &&
                    !processedLines.has(line)) {

                    console.log(`✓ Transação (manual) encontrada:`, { date, description: description.substring(0, 50), amount });

                    transactions.push({
                        date: date,
                        description: description,
                        amount: amount,
                        merchant: extractMerchant(description),
                        category: inferCategory(description)
                    });

                    processedLines.add(line);
                } else {
                    console.log(`⚠️ Linha com data+EUR filtrada:`, {
                        desc_len: description.length,
                        amount,
                        isHeader: description.match(/^(Data|Tipo|Montante|Saldo|Total|Movimentos|Empresa|Conta|Disponível|Autorizado)/i) ? 'SIM' : 'NÃO',
                        line: line.substring(0, 80)
                    });
                }
            } catch (error) {
                console.warn('⚠️ Erro no parsing manual:', error, 'Linha:', line.substring(0, 100));
                continue;
            }
        }
    }

    console.log(`📊 Stats: Linhas com data: ${dateMatchCount}, Linhas com EUR: ${eurMatchCount}`);
    console.log(`Total de transações encontradas (manual): ${transactions.length}`);
    console.log('====================================\n');

    return transactions;
}

/**
 * Normaliza diferentes formatos de data para YYYY-MM-DD
 */
function normalizeDate(dateStr: string): string {
    // DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('-');
        return `${year}-${month}-${day}`;
    }
    
    return new Date().toISOString().split('T')[0];
}

/**
 * Parse valor monetário para número
 */
function parseAmount(amountStr: string): number {
    // Remove símbolos de moeda e espaços
    let cleaned = amountStr.replace(/[€\s+]/g, '');
    
    // Remove pontos de milhar (1.000 -> 1000)
    cleaned = cleaned.replace(/\./g, '');
    
    // Substitui vírgula decimal por ponto (100,50 -> 100.50)
    cleaned = cleaned.replace(',', '.');
    
    return parseFloat(cleaned) || 0;
}

/**
 * Extrai nome do comerciante da descrição
 */
function extractMerchant(description: string): string {
    // Remove palavras comuns de descrições bancárias
    const cleaned = description
        .replace(/^(Compra|Pagamento|Transferência|Débito|Crédito|PIX|TED|DOC|Trf\.)\s+/i, '')
        .replace(/\s+(aprovado|recusado|pendente)$/i, '')
        .trim();
    
    return cleaned.substring(0, 100);
}

/**
 * Infere categoria baseada na descrição
 */
function inferCategory(description: string): string {
    const descLower = description.toLowerCase();
    
    // Alimentação
    if (/restaurante|lanchonete|padaria|supermercado|mercado|ifood|uber\s*eats|rappi|meradona|pingo|sApi|continente|lidl/i.test(descLower)) {
        return 'Alimentação';
    }
    
    // Transporte
    if (/uber|99|taxi|gasolina|posto|combustivel|estacionamento|pedágio|repsol|galp/i.test(descLower)) {
        return 'Transporte';
    }
    
    // Moradia
    if (/aluguel|condomínio|energia|água|gas|internet|luz|iptu/i.test(descLower)) {
        return 'Moradia';
    }
    
    // Entretenimento
    if (/netflix|spotify|cinema|teatro|show|ingresso|amazon\s*prime|disney|apple/i.test(descLower)) {
        return 'Entretenimento';
    }
    
    // Saúde
    if (/farmacia|drogaria|hospital|clinica|medic|plano\s*de\s*saude/i.test(descLower)) {
        return 'Saúde';
    }
    
    // Transferências
    if (/transferência|mb\s*way|trf/i.test(descLower)) {
        return 'Transferência';
    }
    
    return 'Outros';
}

/**
 * Parse transações do texto extraído (função mantida para compatibilidade)
 */
function parseTransactions(text: string): Array<any> {
    return parseFromTextContent(text);
}

/**
 * Insere transações no banco de dados Supabase
 */
async function insertTransactionsToDatabase(transactions: Array<any>, userId: string, supabaseUrl: string, serviceRoleKey: string): Promise<Array<any>> {
    const insertedTransactions = [];
    
    // Buscar ou criar conta padrão para o usuário
    const account = await getOrCreateUserAccount(userId, supabaseUrl, serviceRoleKey);
    console.log('Usando conta:', account.id, 'para inserção de transações');
    
    for (const transaction of transactions) {
        try {
            // Primeiro, buscar ou criar categoria
            const category = await getOrCreateCategory(transaction.category, supabaseUrl, serviceRoleKey);
            
            // Preparar dados da transação - CORRIGIDO: Adicionado account_id
            const transactionData = {
                user_id: userId,
                account_id: account.id,  // ← CAMPO OBRIGATÓRIO ADICIONADO
                description: transaction.description,
                amount: transaction.amount,
                transaction_type: transaction.amount < 0 ? 'despesa' : 'receita',
                transaction_date: transaction.date,
                category_id: category.id,
                merchant: transaction.merchant,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Inserir transação no Supabase
            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(transactionData)
            });
            
            if (insertResponse.ok) {
                const inserted = await insertResponse.json();
                insertedTransactions.push(inserted[0] || transactionData);
                console.log('Transação inserida:', transaction.description);
            } else {
                const error = await insertResponse.text();
                console.error('Erro ao inserir transação:', error);
            }
            
        } catch (error) {
            console.error('Erro ao processar transação:', error);
        }
    }
    
    return insertedTransactions;
}

/**
 * Busca ou cria conta padrão para o usuário
 */
async function getOrCreateUserAccount(userId: string, supabaseUrl: string, serviceRoleKey: string): Promise<any> {
    try {
        // Buscar conta existente do usuário
        const searchResponse = await fetch(`${supabaseUrl}/rest/v1/accounts?user_id=eq.${userId}&is_active=eq.true&limit=1`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Accept': 'application/json'
            }
        });
        
        if (searchResponse.ok) {
            const accounts = await searchResponse.json();
            if (accounts.length > 0) {
                console.log('Conta existente encontrada:', accounts[0].id);
                return accounts[0];
            }
        }
        
        // Se não encontrou, criar nova conta padrão
        const accountData = {
            user_id: userId,
            account_type: 'conta_corrente',
            nickname: 'Conta Principal',
            institution: 'Banco Importado',
            initial_balance: 0.00,
            current_balance: 0.00,
            is_active: true
        };
        
        const createResponse = await fetch(`${supabaseUrl}/rest/v1/accounts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(accountData)
        });
        
        if (createResponse.ok) {
            const newAccounts = await createResponse.json();
            const createdAccount = newAccounts[0] || accountData;
            console.log('Nova conta criada:', createdAccount.id);
            return createdAccount;
        } else {
            const error = await createResponse.text();
            console.error('Erro ao criar conta:', error);
        }
        
    } catch (error) {
        console.error('Erro ao buscar/criar conta:', error);
    }
    
    // Fallback: usar conta fictícia para evitar erro
    return {
        id: '00000000-0000-0000-0000-000000000000',
        nickname: 'Conta Temporária',
        account_type: 'conta_corrente'
    };
}

/**
 * Busca ou cria uma categoria no banco de dados
 */
async function getOrCreateCategory(categoryName: string, supabaseUrl: string, serviceRoleKey: string): Promise<any> {
    try {
        // Buscar categoria existente
        const searchResponse = await fetch(`${supabaseUrl}/rest/v1/categories?name=eq.${encodeURIComponent(categoryName)}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Accept': 'application/json'
            }
        });
        
        if (searchResponse.ok) {
            const categories = await searchResponse.json();
            if (categories.length > 0) {
                return categories[0];
            }
        }
        
        // Se não encontrou, criar nova categoria
        const categoryData = {
            name: categoryName,
            color: getCategoryColor(categoryName),
            is_system: false,
            created_at: new Date().toISOString()
        };
        
        const createResponse = await fetch(`${supabaseUrl}/rest/v1/categories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(categoryData)
        });
        
        if (createResponse.ok) {
            const newCategories = await createResponse.json();
            return newCategories[0] || categoryData;
        }
        
    } catch (error) {
        console.error('Erro ao buscar/criar categoria:', error);
    }
    
    // Fallback: categoria padrão
    return {
        id: 1,
        name: categoryName,
        color: '#94a3b8'
    };
}

/**
 * Define cor padrão baseada na categoria
 */
function getCategoryColor(categoryName: string): string {
    const colors = {
        'Alimentação': '#22c55e',
        'Transporte': '#3b82f6',
        'Moradia': '#f59e0b',
        'Entretenimento': '#8b5cf6',
        'Saúde': '#ef4444',
        'Educação': '#06b6d4',
        'Transferência': '#6366f1',
        'Outros': '#94a3b8'
    };
    
    return colors[categoryName] || '#94a3b8';
}