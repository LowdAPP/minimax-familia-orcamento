// Edge Function: Debt Optimizer
// Simulação de quitação de dívidas (Snowball vs Avalanche)

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
        const { debts, extraPayment, methodology } = await req.json();

        if (!debts || !Array.isArray(debts) || debts.length === 0) {
            throw new Error('Debts array is required');
        }

        if (!extraPayment || extraPayment <= 0) {
            throw new Error('Extra payment amount is required');
        }

        if (!methodology || !['snowball', 'avalanche'].includes(methodology)) {
            throw new Error('Methodology must be "snowball" or "avalanche"');
        }

        // Calculate payoff scenarios
        const snowballResult = calculateSnowball([...debts], extraPayment);
        const avalancheResult = calculateAvalanche([...debts], extraPayment);

        // Compare methods
        const comparison = {
            snowball: snowballResult,
            avalanche: avalancheResult,
            recommendation: recommendMethod(snowballResult, avalancheResult),
            savings: {
                interestSaved: snowballResult.totalInterest - avalancheResult.totalInterest,
                monthsSaved: snowballResult.totalMonths - avalancheResult.totalMonths,
                preferAvalanche: avalancheResult.totalInterest < snowballResult.totalInterest
            }
        };

        return new Response(JSON.stringify({
            data: {
                methodology,
                selected: methodology === 'snowball' ? snowballResult : avalancheResult,
                comparison
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Debt optimization error:', error);

        const errorResponse = {
            error: {
                code: 'OPTIMIZATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Método Snowball (menor saldo primeiro)
function calculateSnowball(debts, extraPayment) {
    // Ordenar por saldo (menor para maior)
    const sortedDebts = debts.sort((a, b) => a.current_balance - b.current_balance);
    
    return simulatePayoff(sortedDebts, extraPayment, 'snowball');
}

// Método Avalanche (maior taxa de juros primeiro)
function calculateAvalanche(debts, extraPayment) {
    // Ordenar por taxa de juros (maior para menor)
    const sortedDebts = debts.sort((a, b) => b.interest_rate - a.interest_rate);
    
    return simulatePayoff(sortedDebts, extraPayment, 'avalanche');
}

// Simular quitação de dívidas
function simulatePayoff(debts, extraPayment, methodology) {
    const timeline = [];
    let totalInterest = 0;
    let totalMonths = 0;
    let currentDebts = debts.map(d => ({...d}));
    
    // Simular mês a mês
    while (currentDebts.some(d => d.current_balance > 0)) {
        totalMonths++;
        
        if (totalMonths > 600) { // Limite de 50 anos para evitar loop infinito
            break;
        }
        
        // Calcular juros do mês
        for (const debt of currentDebts) {
            if (debt.current_balance > 0) {
                const monthlyInterest = (debt.current_balance * (debt.interest_rate / 100)) / 12;
                debt.current_balance += monthlyInterest;
                totalInterest += monthlyInterest;
            }
        }
        
        // Pagar mínimos de todas as dívidas
        for (const debt of currentDebts) {
            if (debt.current_balance > 0) {
                const payment = Math.min(debt.minimum_payment, debt.current_balance);
                debt.current_balance -= payment;
            }
        }
        
        // Aplicar pagamento extra na primeira dívida não quitada
        let remainingExtra = extraPayment;
        
        for (const debt of currentDebts) {
            if (debt.current_balance > 0 && remainingExtra > 0) {
                const extraApplied = Math.min(remainingExtra, debt.current_balance);
                debt.current_balance -= extraApplied;
                remainingExtra -= extraApplied;
                
                // Se quitou, registrar vitória
                if (debt.current_balance <= 0) {
                    timeline.push({
                        month: totalMonths,
                        event: 'debt_paid_off',
                        debtName: debt.creditor_name,
                        originalBalance: debt.original_balance
                    });
                }
                
                break; // Focar em uma dívida por vez
            }
        }
    }
    
    return {
        methodology,
        totalMonths,
        totalInterest: Math.round(totalInterest * 100) / 100,
        timeline,
        payoffOrder: debts.map(d => d.creditor_name),
        estimatedCompletion: new Date(Date.now() + totalMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
}

// Recomendar método baseado em perfil
function recommendMethod(snowball, avalanche) {
    const interestDiff = snowball.totalInterest - avalanche.totalInterest;
    const monthsDiff = snowball.totalMonths - avalanche.totalMonths;
    
    // Se diferença de juros é significativa (>10% ou >R$500), recomendar Avalanche
    if (interestDiff > 500 || (interestDiff / snowball.totalInterest) > 0.10) {
        return {
            recommended: 'avalanche',
            reason: 'Economia significativa de juros',
            savings: `Economize R$ ${Math.round(interestDiff)} em juros`,
            profile: 'Otimizador racional - foco em minimizar custos'
        };
    }
    
    // Se diferença é pequena, recomendar Snowball para motivação
    return {
        recommended: 'snowball',
        reason: 'Vitórias rápidas para manter motivação',
        savings: `Diferença de apenas R$ ${Math.round(interestDiff)} em juros`,
        profile: 'Motivado por conquistas - foco em progresso visível'
    };
}