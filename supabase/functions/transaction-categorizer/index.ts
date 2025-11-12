// Edge Function: Transaction Categorizer
// Categorização automática de transações usando IA/Pattern Matching

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
        // Get request data
        const { transactions } = await req.json();

        if (!transactions || !Array.isArray(transactions)) {
            throw new Error('Transactions array is required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get user from auth header
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            throw new Error('No authorization header');
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token and get user
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            throw new Error('Invalid token');
        }

        const userData = await userResponse.json();
        const userId = userData.id;

        // Fetch system categories
        const categoriesResponse = await fetch(
            `${supabaseUrl}/rest/v1/categories?is_system_category=eq.true&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!categoriesResponse.ok) {
            throw new Error('Failed to fetch categories');
        }

        const categories = await categoriesResponse.json();

        // Categorize each transaction
        const categorizedTransactions = transactions.map(transaction => {
            const category = categorizeSingle(transaction, categories);
            
            return {
                ...transaction,
                category_id: category.id,
                category_name: category.name,
                category_type: category.category_type,
                confidence: category.confidence
            };
        });

        return new Response(JSON.stringify({
            data: {
                categorizedCount: categorizedTransactions.length,
                transactions: categorizedTransactions
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Transaction categorization error:', error);

        const errorResponse = {
            error: {
                code: 'CATEGORIZATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Categorize single transaction using pattern matching
function categorizeSingle(transaction, categories) {
    const description = transaction.description.toLowerCase();
    const merchant = (transaction.merchant || '').toLowerCase();
    const text = `${description} ${merchant}`;
    
    // Padrões de categorização por palavra-chave
    const patterns = {
        'Moradia': ['aluguel', 'condominio', 'iptu', 'luz', 'agua', 'gas', 'internet', 'energia', 'eletrica'],
        'Alimentação': ['mercado', 'supermercado', 'padaria', 'acougue', 'feira', 'hortifruti', 'ifood', 'rappi'],
        'Transporte': ['uber', '99', 'combustivel', 'gasolina', 'posto', 'ipva', 'estacionamento', 'metrô', 'onibus'],
        'Saúde': ['farmacia', 'drogaria', 'hospital', 'clinica', 'medico', 'plano de saude', 'unimed', 'amil'],
        'Educação': ['escola', 'faculdade', 'curso', 'livro', 'material escolar', 'mensalidade'],
        'Lazer': ['cinema', 'teatro', 'show', 'parque', 'netflix', 'spotify', 'disney', 'prime'],
        'Compras': ['loja', 'magazine', 'americanas', 'mercado livre', 'amazon', 'shein', 'shopee'],
        'Restaurantes': ['restaurante', 'bar', 'lanchonete', 'mcdonald', 'burguer', 'pizza', 'cafe'],
        'Viagens': ['hotel', 'pousada', 'passagem', 'aviao', 'gol', 'latam', 'azul', 'booking'],
        'Dívidas': ['cartao', 'emprestimo', 'financiamento', 'parcela', 'boleto']
    };
    
    // Try to match patterns
    let bestMatch = null;
    let highestScore = 0;
    
    for (const [categoryName, keywords] of Object.entries(patterns)) {
        let score = 0;
        
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                score += 10;
            }
        }
        
        if (score > highestScore) {
            highestScore = score;
            bestMatch = categoryName;
        }
    }
    
    // Find category by name
    const category = categories.find(cat => cat.name === bestMatch);
    
    if (category) {
        return {
            id: category.id,
            name: category.name,
            category_type: category.category_type,
            confidence: Math.min(highestScore / 10, 1.0)
        };
    }
    
    // Default category (Compras - superfluo)
    const defaultCategory = categories.find(cat => cat.name === 'Compras');
    return {
        id: defaultCategory.id,
        name: defaultCategory.name,
        category_type: defaultCategory.category_type,
        confidence: 0.3
    };
}