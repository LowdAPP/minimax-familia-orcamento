// Edge Function: Alert Engine
// Sistema de alertas inteligentes baseado em comportamento

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
        const { userId } = await req.json();

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Get environment variables
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Fetch user data
        const userData = await fetchUserData(supabaseUrl, serviceRoleKey, userId);

        // Generate alerts based on user behavior
        const alerts = [];

        // Check envelope limits
        if (userData.budget && userData.budget.methodology === 'envelope') {
            const envelopeAlerts = checkEnvelopeLimits(userData.envelopes);
            alerts.push(...envelopeAlerts);
        }

        // Check upcoming due dates
        const dueDateAlerts = checkDueDates(userData.debts);
        alerts.push(...dueDateAlerts);

        // Check budget review reminder
        const reviewAlert = checkBudgetReview(userData.lastReview);
        if (reviewAlert) alerts.push(reviewAlert);

        // Check streak status
        const streakAlert = checkStreak(userData.streak);
        if (streakAlert) alerts.push(streakAlert);

        // Check free balance opportunity
        const balanceAlert = checkFreeBalance(userData.freeBalance);
        if (balanceAlert) alerts.push(balanceAlert);

        // Prioritize alerts
        const prioritizedAlerts = prioritizeAlerts(alerts);

        return new Response(JSON.stringify({
            data: {
                alertCount: prioritizedAlerts.length,
                alerts: prioritizedAlerts
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Alert engine error:', error);

        const errorResponse = {
            error: {
                code: 'ALERT_GENERATION_FAILED',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

// Fetch user financial data
async function fetchUserData(supabaseUrl, serviceRoleKey, userId) {
    // Simplified - in production, fetch from multiple tables
    return {
        budget: { methodology: 'envelope' },
        envelopes: [
            { name: 'Compras', allocated: 500, spent: 420, limit: 500 },
            { name: 'Lazer', allocated: 300, spent: 280, limit: 300 }
        ],
        debts: [
            { creditor_name: 'Cartão Nubank', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) }
        ],
        lastReview: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        streak: 12,
        freeBalance: 350
    };
}

// Check envelope limits (>80% = warning)
function checkEnvelopeLimits(envelopes) {
    const alerts = [];
    
    for (const envelope of envelopes) {
        const percentage = (envelope.spent / envelope.limit) * 100;
        
        if (percentage >= 80 && percentage < 95) {
            alerts.push({
                type: 'envelope_limit',
                priority: 'medium',
                message: `Você está a R$ ${(envelope.limit - envelope.spent).toFixed(2)} do limite de '${envelope.name}'`,
                action: 'Considere adiar compras ou realocar valor de outro envelope',
                data: { envelope: envelope.name, percentage: percentage.toFixed(1) }
            });
        } else if (percentage >= 95) {
            alerts.push({
                type: 'envelope_limit',
                priority: 'high',
                message: `Limite de '${envelope.name}' quase excedido!`,
                action: 'Realocar valor de outro envelope ou aguardar próximo mês',
                data: { envelope: envelope.name, percentage: percentage.toFixed(1) }
            });
        }
    }
    
    return alerts;
}

// Check due dates (<=7 days = alert)
function checkDueDates(debts) {
    const alerts = [];
    const now = new Date();
    
    for (const debt of debts) {
        const dueDate = new Date(debt.due_date);
        const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 7 && daysUntilDue > 0) {
            alerts.push({
                type: 'due_date',
                priority: 'high',
                message: `Sua dívida '${debt.creditor_name}' vence em ${daysUntilDue} dias`,
                action: 'Pagar agora, negociar ou priorizar no plano de quitação',
                data: { debt: debt.creditor_name, daysUntilDue }
            });
        }
    }
    
    return alerts;
}

// Check budget review reminder (>3 days without review)
function checkBudgetReview(lastReview) {
    const now = new Date();
    const daysSinceReview = Math.floor((now - lastReview) / (1000 * 60 * 60 * 24));
    
    if (daysSinceReview >= 3) {
        return {
            type: 'budget_review',
            priority: 'medium',
            message: 'Hora de revisar seu orçamento',
            action: 'Abrir checklist semanal e categorizar transações pendentes',
            data: { daysSinceReview }
        };
    }
    
    return null;
}

// Check streak status
function checkStreak(streakCount) {
    if (streakCount >= 4) {
        return {
            type: 'habit_streak',
            priority: 'low',
            message: `Parabéns! ${streakCount} semanas consecutivas de revisão`,
            action: 'Continue assim para conquistar mais badges',
            data: { streakCount }
        };
    }
    
    return null;
}

// Check free balance opportunity
function checkFreeBalance(freeBalance) {
    if (freeBalance >= 100) {
        return {
            type: 'free_balance',
            priority: 'low',
            message: `Você tem R$ ${freeBalance.toFixed(2)} de saldo livre`,
            action: 'Alocar na reserva de emergência ou criar uma nova meta',
            data: { amount: freeBalance }
        };
    }
    
    return null;
}

// Prioritize alerts (high > medium > low)
function prioritizeAlerts(alerts) {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    
    return alerts.sort((a, b) => {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
}