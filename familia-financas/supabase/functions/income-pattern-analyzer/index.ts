// Edge Function: Análise de Padrões de Receita
// Analisa transações de receita para identificar padrões e prever entradas futuras

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { user_id, months_to_analyze = 6, months_to_predict = 3 } = await req.json();

    if (!user_id) {
      throw new Error('user_id é obrigatório');
    }

    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Buscar transações de receita dos últimos meses
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months_to_analyze);
    
    const transactionsResponse = await fetch(
      `${supabaseUrl}/rest/v1/transactions?user_id=eq.${user_id}&transaction_type=eq.receita&transaction_date=gte.${startDate.toISOString().split('T')[0]}&order=transaction_date.asc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!transactionsResponse.ok) {
      throw new Error('Erro ao buscar transações');
    }

    const transactions = await transactionsResponse.json();

    // Analisar padrões
    const patterns = analyzeIncomePatterns(transactions);
    
    // Prever receitas futuras
    const predictions = predictFutureIncome(patterns, months_to_predict);
    
    // Calcular métricas
    const metrics = calculateMetrics(transactions, patterns);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          patterns,
          predictions,
          metrics,
          transactions_analyzed: transactions.length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Analisa padrões nas transações de receita
function analyzeIncomePatterns(transactions: any[]) {
  const patterns: any[] = [];
  
  // Agrupar transações por descrição/merchant para identificar receitas recorrentes
  const groupedBySource: { [key: string]: any[] } = {};
  
  transactions.forEach(t => {
    const key = (t.merchant || t.description).toLowerCase();
    if (!groupedBySource[key]) {
      groupedBySource[key] = [];
    }
    groupedBySource[key].push(t);
  });

  // Analisar cada grupo
  Object.entries(groupedBySource).forEach(([source, txs]) => {
    if (txs.length >= 2) {
      // Calcular intervalo médio entre transações
      const dates = txs.map(t => new Date(t.transaction_date)).sort((a, b) => a.getTime() - b.getTime());
      const intervals: number[] = [];
      
      for (let i = 1; i < dates.length; i++) {
        const daysDiff = Math.round((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
        intervals.push(daysDiff);
      }

      const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
      const avgAmount = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0) / txs.length;
      
      // Identificar tipo de padrão
      let frequency = 'irregular';
      let predictability = 'baixa';
      
      if (avgInterval >= 25 && avgInterval <= 35) {
        frequency = 'mensal';
        predictability = 'alta';
      } else if (avgInterval >= 12 && avgInterval <= 17) {
        frequency = 'quinzenal';
        predictability = 'alta';
      } else if (avgInterval >= 6 && avgInterval <= 8) {
        frequency = 'semanal';
        predictability = 'media';
      } else if (avgInterval >= 85 && avgInterval <= 95) {
        frequency = 'trimestral';
        predictability = 'media';
      }

      // Detectar dia do mês típico (para receitas mensais)
      let typicalDay = null;
      if (frequency === 'mensal') {
        const days = dates.map(d => d.getDate());
        typicalDay = Math.round(days.reduce((sum, d) => sum + d, 0) / days.length);
      }

      patterns.push({
        source: txs[0].merchant || txs[0].description,
        frequency,
        predictability,
        avg_interval_days: Math.round(avgInterval),
        avg_amount: Math.round(avgAmount * 100) / 100,
        occurrences: txs.length,
        typical_day: typicalDay,
        last_date: dates[dates.length - 1].toISOString().split('T')[0],
        category: detectIncomeCategory(txs[0]),
      });
    }
  });

  // Ordenar por previsibilidade e valor
  return patterns.sort((a, b) => {
    const predWeight = { alta: 3, media: 2, baixa: 1 };
    const scoreA = predWeight[a.predictability] * a.avg_amount;
    const scoreB = predWeight[b.predictability] * b.avg_amount;
    return scoreB - scoreA;
  });
}

// Detecta categoria da receita
function detectIncomeCategory(transaction: any) {
  const desc = (transaction.merchant || transaction.description).toLowerCase();
  
  if (desc.includes('salario') || desc.includes('salário') || desc.includes('vencimento') || desc.includes('pagamento')) {
    return 'salario';
  }
  if (desc.includes('freelance') || desc.includes('freelancer') || desc.includes('projeto') || desc.includes('consultor')) {
    return 'freelance';
  }
  if (desc.includes('aluguel') || desc.includes('arrendamento') || desc.includes('renda')) {
    return 'aluguel';
  }
  if (desc.includes('investimento') || desc.includes('dividendo') || desc.includes('juros')) {
    return 'investimentos';
  }
  
  return 'outros';
}

// Prevê receitas futuras baseado nos padrões
function predictFutureIncome(patterns: any[], monthsAhead: number) {
  const predictions: any[] = [];
  const today = new Date();
  
  patterns.forEach(pattern => {
    if (pattern.predictability === 'baixa') {
      return; // Não prever receitas muito irregulares
    }

    const lastDate = new Date(pattern.last_date);
    let nextDate = new Date(lastDate);
    
    // Prever próximas ocorrências
    for (let i = 0; i < monthsAhead * 4; i++) {
      nextDate = new Date(nextDate);
      nextDate.setDate(nextDate.getDate() + pattern.avg_interval_days);
      
      if (nextDate <= today) continue;
      
      // Parar se ultrapassar o período de previsão
      const monthsDiff = (nextDate.getFullYear() - today.getFullYear()) * 12 + (nextDate.getMonth() - today.getMonth());
      if (monthsDiff > monthsAhead) break;
      
      predictions.push({
        date: nextDate.toISOString().split('T')[0],
        source: pattern.source,
        predicted_amount: pattern.avg_amount,
        confidence: pattern.predictability === 'alta' ? 0.9 : 0.7,
        category: pattern.category,
        frequency: pattern.frequency,
      });
    }
  });

  return predictions.sort((a, b) => a.date.localeCompare(b.date));
}

// Calcula métricas gerais
function calculateMetrics(transactions: any[], patterns: any[]) {
  const totalIncome = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const avgMonthlyIncome = transactions.length > 0 ? totalIncome / Math.max(1, Math.ceil(transactions.length / 4)) : 0;
  
  const predictableIncome = patterns
    .filter(p => p.predictability === 'alta')
    .reduce((sum, p) => sum + p.avg_amount, 0);
  
  const irregularIncome = patterns
    .filter(p => p.predictability === 'baixa')
    .reduce((sum, p) => sum + p.avg_amount, 0);

  // Calcular variabilidade
  const amounts = transactions.map(t => Math.abs(t.amount));
  const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avgAmount, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const variability = avgAmount > 0 ? (stdDev / avgAmount) : 0;

  return {
    total_income_analyzed: Math.round(totalIncome * 100) / 100,
    avg_monthly_income: Math.round(avgMonthlyIncome * 100) / 100,
    predictable_monthly_income: Math.round(predictableIncome * 100) / 100,
    irregular_monthly_income: Math.round(irregularIncome * 100) / 100,
    income_variability: Math.round(variability * 100) / 100,
    predictability_score: Math.round((predictableIncome / (predictableIncome + irregularIncome)) * 100) / 100,
    total_patterns_found: patterns.length,
    high_predictability_sources: patterns.filter(p => p.predictability === 'alta').length,
  };
}
