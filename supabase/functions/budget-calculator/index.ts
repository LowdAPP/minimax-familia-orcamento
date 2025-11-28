// Edge Function: Budget Calculator
// Cálculo de orçamentos usando diferentes metodologias

Deno.serve(async (req) => {
    // Configuração de CORS mais segura
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://familia-financas.vercel.app',
        'https://minimax-familia-orcamento.vercel.app'
    ];
    
    const origin = req.headers.get('Origin');
    const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : '*'; // Em dev permitimos *, em prod deve ser restrito

    const corsHeaders = {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        // Get Supabase credentials to verify auth
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Validação de Autenticação (JWT)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({
                error: {
                    code: 'AUTH_MISSING',
                    message: 'Token de autenticação obrigatório'
                }
            }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Validar usuário com Supabase Auth
        const token = authHeader.replace('Bearer ', '');
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': serviceRoleKey
            }
        });

        if (!userResponse.ok) {
            return new Response(JSON.stringify({
                error: {
                    code: 'AUTH_INVALID',
                    message: 'Token de autenticação inválido ou expirado'
                }
            }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Get request data
        const { methodology, monthlyIncome, expenses } = await req.json();

        if (!methodology || !monthlyIncome) {
            throw new Error('Methodology and monthly income are required');
        }

        let budget;

        switch (methodology) {
            case '50_30_20':
                budget = calculate50_30_20(monthlyIncome, expenses);
                break;
            
            case 'envelope':
                budget = calculateEnvelope(monthlyIncome, expenses);
                break;
            
            case 'zero_based':
                budget = calculateZeroBased(monthlyIncome, expenses);
                break;
            
            default:
                throw new Error(`Unknown methodology: ${methodology}`);
        }

        return new Response(JSON.stringify({
            data: {
                methodology,
                budget
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Budget calculation error:', error);

        const errorResponse = {
            error: {
                code: 'CALCULATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Metodologia 50/30/20
function calculate50_30_20(monthlyIncome, expenses) {
    const needsAmount = monthlyIncome * 0.50;    // 50% necessidades
    const wantsAmount = monthlyIncome * 0.30;    // 30% desejos
    const savingsAmount = monthlyIncome * 0.20;  // 20% poupança/dívidas
    
    return {
        totalIncome: monthlyIncome,
        needs: {
            allocated: needsAmount,
            percentage: 50,
            description: 'Necessidades básicas (moradia, alimentação, transporte, saúde)'
        },
        wants: {
            allocated: wantsAmount,
            percentage: 30,
            description: 'Desejos pessoais (lazer, restaurantes, compras)'
        },
        savings: {
            allocated: savingsAmount,
            percentage: 20,
            description: 'Poupança, investimentos e quitação de dívidas'
        },
        freeBalance: 0 // Tudo alocado
    };
}

// Metodologia Envelope (baseado em categorias)
function calculateEnvelope(monthlyIncome, expenses) {
    // Categorias padrão com sugestões de percentuais
    const envelopeDefaults = {
        'Moradia': 0.30,        // 30%
        'Alimentação': 0.15,    // 15%
        'Transporte': 0.10,     // 10%
        'Saúde': 0.08,          // 8%
        'Educação': 0.05,       // 5%
        'Lazer': 0.08,          // 8%
        'Compras': 0.07,        // 7%
        'Restaurantes': 0.05,   // 5%
        'Poupança': 0.10,       // 10%
        'Reserva': 0.02         // 2%
    };
    
    const envelopes = {};
    let totalAllocated = 0;
    
    // Calcular valores por envelope
    for (const [category, percentage] of Object.entries(envelopeDefaults)) {
        const amount = monthlyIncome * percentage;
        envelopes[category] = {
            allocated: amount,
            spent: 0,
            remaining: amount,
            percentage: percentage * 100,
            limit: amount
        };
        totalAllocated += amount;
    }
    
    return {
        totalIncome: monthlyIncome,
        envelopes,
        totalAllocated,
        freeBalance: monthlyIncome - totalAllocated
    };
}

// Metodologia Zero-Based (cada real tem destino)
function calculateZeroBased(monthlyIncome, expenses) {
    // Priorização de categorias
    const priorities = {
        essential: ['Moradia', 'Alimentação', 'Transporte', 'Saúde'],
        savings: ['Poupança', 'Reserva'],
        discretionary: ['Lazer', 'Compras', 'Restaurantes']
    };
    
    const allocations = {};
    let remaining = monthlyIncome;
    
    // Alocar essenciais primeiro (70% do total)
    const essentialBudget = monthlyIncome * 0.70;
    const essentialPerCategory = essentialBudget / priorities.essential.length;
    
    for (const category of priorities.essential) {
        allocations[category] = {
            allocated: essentialPerCategory,
            priority: 'high',
            type: 'essential'
        };
        remaining -= essentialPerCategory;
    }
    
    // Alocar poupança (15% do total)
    const savingsBudget = monthlyIncome * 0.15;
    const savingsPerCategory = savingsBudget / priorities.savings.length;
    
    for (const category of priorities.savings) {
        allocations[category] = {
            allocated: savingsPerCategory,
            priority: 'medium',
            type: 'savings'
        };
        remaining -= savingsPerCategory;
    }
    
    // Alocar discricionário com o restante (15% do total)
    const discretionaryPerCategory = remaining / priorities.discretionary.length;
    
    for (const category of priorities.discretionary) {
        allocations[category] = {
            allocated: discretionaryPerCategory,
            priority: 'low',
            type: 'discretionary'
        };
        remaining -= discretionaryPerCategory;
    }
    
    return {
        totalIncome: monthlyIncome,
        allocations,
        totalAllocated: monthlyIncome,
        freeBalance: Math.round(remaining * 100) / 100, // Should be ~0
        priorities
    };
}