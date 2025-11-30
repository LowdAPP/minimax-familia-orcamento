# Edge Functions - Backend Supabase

## Funções Criadas

### 1. pdf-parser
**Propósito:** Upload e parsing automático de PDFs bancários

**Funcionalidades:**
- Upload de PDF para Supabase Storage (bucket: bank-statements)
- Extração de texto do PDF
- Parsing de transações usando regex patterns
- Suporte para múltiplos formatos de extratos bancários brasileiros
- Retorna lista de transações prontas para categorização

**Endpoint:** `https://odgjjncxcseuemrwskip.supabase.co/functions/v1/pdf-parser`

**Input:**
```json
{
  "pdfData": "base64_encoded_pdf",
  "fileName": "extrato_janeiro.pdf",
  "bankName": "nubank"
}
```

**Output:**
```json
{
  "data": {
    "filePath": "bank-statements/user_id/timestamp-extrato_janeiro.pdf",
    "transactionCount": 15,
    "transactions": [
      {
        "date": "2025-01-15",
        "description": "SUPERMERCADO XYZ",
        "amount": -150.50,
        "type": "despesa",
        "source": "pdf_import",
        "bankName": "nubank"
      }
    ]
  }
}
```

---

### 2. transaction-categorizer
**Propósito:** Categorização automática de transações usando IA/Pattern Matching

**Funcionalidades:**
- Categorização baseada em palavras-chave
- Matching com categorias do sistema
- Score de confiança para cada categorização
- Suporte para aprendizado incremental

**Endpoint:** `https://odgjjncxcseuemrwskip.supabase.co/functions/v1/transaction-categorizer`

**Input:**
```json
{
  "transactions": [
    {
      "description": "IFOOD RESTAURANTE",
      "merchant": "IFOOD",
      "amount": -45.90
    }
  ]
}
```

**Output:**
```json
{
  "data": {
    "categorizedCount": 1,
    "transactions": [
      {
        "description": "IFOOD RESTAURANTE",
        "category_id": "uuid",
        "category_name": "Alimentação",
        "category_type": "essencial",
        "confidence": 1.0
      }
    ]
  }
}
```

---

### 3. budget-calculator
**Propósito:** Cálculo de orçamentos usando metodologias comprovadas

**Funcionalidades:**
- Metodologia 50/30/20 (Elizabeth Warren)
- Metodologia Envelope (Dave Ramsey)
- Metodologia Zero-Based Budgeting
- Sugestões personalizadas por perfil

**Endpoint:** `https://odgjjncxcseuemrwskip.supabase.co/functions/v1/budget-calculator`

**Input:**
```json
{
  "methodology": "50_30_20",
  "monthlyIncome": 3000.00,
  "expenses": []
}
```

**Output (50/30/20):**
```json
{
  "data": {
    "methodology": "50_30_20",
    "budget": {
      "totalIncome": 3000.00,
      "needs": {
        "allocated": 1500.00,
        "percentage": 50,
        "description": "Necessidades básicas"
      },
      "wants": {
        "allocated": 900.00,
        "percentage": 30,
        "description": "Desejos pessoais"
      },
      "savings": {
        "allocated": 600.00,
        "percentage": 20,
        "description": "Poupança e quitação de dívidas"
      }
    }
  }
}
```

---

### 4. debt-optimizer
**Propósito:** Simulação e otimização de quitação de dívidas

**Funcionalidades:**
- Método Snowball (menor saldo primeiro)
- Método Avalanche (maior taxa de juros primeiro)
- Comparação automática entre métodos
- Cálculo de economia de juros e tempo
- Recomendação personalizada por perfil

**Endpoint:** `https://odgjjncxcseuemrwskip.supabase.co/functions/v1/debt-optimizer`

**Input:**
```json
{
  "debts": [
    {
      "creditor_name": "Cartão Nubank",
      "current_balance": 2500.00,
      "interest_rate": 12.5,
      "minimum_payment": 250.00
    },
    {
      "creditor_name": "Empréstimo Banco",
      "current_balance": 5000.00,
      "interest_rate": 8.0,
      "minimum_payment": 500.00
    }
  ],
  "extraPayment": 300.00,
  "methodology": "avalanche"
}
```

**Output:**
```json
{
  "data": {
    "methodology": "avalanche",
    "selected": {
      "methodology": "avalanche",
      "totalMonths": 18,
      "totalInterest": 850.25,
      "payoffOrder": ["Cartão Nubank", "Empréstimo Banco"],
      "estimatedCompletion": "2026-06-15"
    },
    "comparison": {
      "snowball": {...},
      "avalanche": {...},
      "savings": {
        "interestSaved": 125.50,
        "monthsSaved": 2,
        "preferAvalanche": true
      }
    }
  }
}
```

---

### 5. alert-engine
**Propósito:** Sistema de alertas inteligentes baseado em comportamento

**Funcionalidades:**
- Alerta de limite de envelope (>80%)
- Alerta de vencimento de dívidas (<=7 dias)
- Lembrete de revisão semanal (>3 dias sem revisão)
- Reconhecimento de streak (>=4 semanas)
- Oportunidade de saldo livre (>=R$100)
- Priorização automática (high > medium > low)

**Endpoint:** `https://odgjjncxcseuemrwskip.supabase.co/functions/v1/alert-engine`

**Input:**
```json
{
  "userId": "user_uuid"
}
```

**Output:**
```json
{
  "data": {
    "alertCount": 3,
    "alerts": [
      {
        "type": "due_date",
        "priority": "high",
        "message": "Sua dívida 'Cartão Nubank' vence em 5 dias",
        "action": "Pagar agora, negociar ou priorizar no plano de quitação",
        "data": { "debt": "Cartão Nubank", "daysUntilDue": 5 }
      },
      {
        "type": "envelope_limit",
        "priority": "medium",
        "message": "Você está a R$ 80.00 do limite de 'Compras'",
        "action": "Considere adiar compras ou realocar valor de outro envelope",
        "data": { "envelope": "Compras", "percentage": "84.0" }
      }
    ]
  }
}
```

---

## Deploy das Edge Functions

Execute o deploy após o setup do banco de dados:

```bash
# Deploy todas as funções
supabase functions deploy pdf-parser
supabase functions deploy transaction-categorizer
supabase functions deploy budget-calculator
supabase functions deploy debt-optimizer
supabase functions deploy alert-engine
```

Ou use o deploy automatizado (será executado após inicialização do projeto React).

---

## Teste das Edge Functions

Use `test_edge_function` tool para testar cada função:

```javascript
// Exemplo: Testar categorização
await test_edge_function({
  function_url: 'https://odgjjncxcseuemrwskip.supabase.co/functions/v1/transaction-categorizer',
  test_data: {
    transactions: [{
      description: 'IFOOD RESTAURANTE',
      merchant: 'IFOOD',
      amount: -45.90
    }]
  }
});
```

---

## Notas Importantes

1. **Todas as funções seguem best practices:**
   - CORS headers completos
   - Tratamento robusto de erros
   - Sem imports externos (apenas Deno/Web APIs)
   - Verificação de autenticação
   - Respostas JSON estruturadas

2. **RLS Policies:**
   - Todas as operações respeitam RLS
   - Policies permitem `anon` e `service_role`
   - Ver `supabase/migrations/001_create_complete_schema.sql`

3. **Produção:**
   - PDF Parser: Em produção, usar API externa (AWS Textract, Azure Form Recognizer)
   - Transaction Categorizer: Em produção, integrar com modelo de ML (OpenAI, Anthropic)
   - Alert Engine: Em produção, adicionar notificações push/email/SMS
