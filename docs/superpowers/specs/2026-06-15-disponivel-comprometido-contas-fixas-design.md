# Design — Disponível vs Comprometido, Contas Fixas, Limites e Reunião Semanal

**Data:** 2026-06-15
**App:** familia-financas (React + Vite + TS, backend Node.js, Supabase Postgres)
**Autor:** Lucas + Claude

## 1. Problema

A família recebe em 3 datas diferentes do mês e hoje só consegue olhar o **saldo da
conta** — que engana, porque parte do saldo já está comprometida com contas futuras.
Falta responder rapidamente a 3 perguntas:

1. Quanto temos hoje?
2. Quanto já está comprometido?
3. Quanto podemos gastar sem prejudicar o resto do mês?

## 2. Escopo

**Dentro:**
- Visão **Disponível vs Comprometido** (número de topo no Dashboard).
- **Contas Fixas** com dia de vencimento e estado pago/por pagar por mês (checkbox).
- **Limites semanais** para categorias variáveis (mensal ÷ nº de semanas).
- **Reunião Semanal**: tela-resumo de 15 min (entrou / gastou / sobrou / dentro do
  orçamento / poupado).

**Fora (já existe ou descartado):**
- Método de envelopes — já existe (`categories.envelope_limit`, metodologia envelope).
- Fundo de emergência — já existe (`goals.goal_type = reserva_emergencia`).
- Calendário de receitas — já existe (`IncomeCalendarPage`).
- "Plano por data de recebimento" (reservar X após cada paycheck) — **descartado** neste ciclo.

## 3. Referência visual

Inspirado numa planilha "Simple Budget" (budget by paycheck/monthly/biweekly/weekly):
- **LEFT TO SPEND** (número grande) → nosso **Disponível**.
- **BILLS** com coluna *Due* + checkboxes → `fixed_bills` + `fixed_bill_payments`.
- **DAYS LEFT** → card "Dias restantes no mês".
- **CASH FLOW** (Budget / Actual / Left) → bloco resumo no Dashboard.
- **EXPENSE** com coluna *Left* → já existe via `budget_items` (allocated − spent).

## 4. Modelo de dados

### 4.1 Nova tabela `fixed_bills` (definição da conta fixa recorrente)

| coluna | tipo | nota |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | dono (RLS) |
| name | VARCHAR(100) | "Renda", "Luz/Gás" |
| amount | DECIMAL(10,2) | valor planeado |
| due_day | INTEGER (1–31) | dia de vencimento |
| category_id | UUID → categories | opcional |
| is_active | BOOLEAN | default true |
| created_at / updated_at | TIMESTAMP | |

### 4.2 Nova tabela `fixed_bill_payments` (estado por mês)

| coluna | tipo | nota |
|---|---|---|
| id | UUID PK | |
| fixed_bill_id | UUID → fixed_bills | |
| user_id | UUID | RLS |
| month_year | VARCHAR(7) | "2026-06" |
| is_paid | BOOLEAN | default false |
| paid_date | DATE | nullable |
| transaction_id | UUID → transactions | nullable (vínculo opcional) |
| amount_paid | DECIMAL(10,2) | valor real pago |

Constraint: `UNIQUE(fixed_bill_id, month_year)` — um registro por conta/mês.

### 4.3 Tabela opcional `weekly_limits` (override manual)

Por padrão o limite semanal é **calculado** (sem schema). Esta tabela só existe para
permitir sobrepor o valor automático por categoria/mês. Pode ser deixada para depois.

| coluna | tipo | nota |
|---|---|---|
| id | UUID PK | |
| user_id | UUID | RLS |
| category_id | UUID → categories | |
| month_year | VARCHAR(7) | |
| weekly_amount | DECIMAL(10,2) | override do valor/semana |

### 4.4 RLS

RLS por `user_id` em todas as tabelas novas, seguindo o padrão existente da app.

## 5. Fórmulas (mês corrente)

```
comprometido = Σ fixed_bills.amount
               (contas ativas SEM fixed_bill_payments.is_paid = true neste mês)

saldo_corrente = Σ accounts.current_balance  (account_type = conta_corrente)
                 # poupança NÃO entra no disponível

disponível   = saldo_corrente − comprometido

ja_pago_mes  = Σ fixed_bill_payments.amount_paid  (is_paid = true, mês corrente)

ja_poupado   = Σ accounts.current_balance (account_type = poupanca)  // card informativo

dias_restantes = último_dia_do_mês − dia_atual
```

### Limites semanais

```
nº_semanas      = ceil(dias_do_mês / 7)            # blocos de 7 dias a partir do dia 1
limite_semana   = budget_items.allocated_amount ÷ nº_semanas   (ou weekly_limits override)
semana_atual    = floor((dia_atual − 1) / 7) + 1
gasto_semana    = Σ transactions.amount (categoria, despesa, dentro do bloco da semana)
resta_semana    = limite_semana − gasto_semana
```

Semana = bloco de 7 dias a partir do dia 1 (Semana 1: 1–7, Semana 2: 8–14, …).
Aplica-se apenas a categorias variáveis (não às contas fixas).

## 6. Telas / UI

### 6.1 Dashboard — faixa de topo (cards)

`DISPONÍVEL` (destaque) · `COMPROMETIDO` · `DIAS RESTANTES` · `JÁ POUPADO`.

### 6.2 Dashboard — bloco CASH FLOW

Planeado vs Real vs Resta para: Entradas · Contas Fixas · Gastos Variáveis · Poupança.

### 6.3 Página/secção CONTAS FIXAS

Tabela: `CONTA | VENC. | PLANEADO | PAGO? (checkbox) | REAL`.
Marcar checkbox → upsert em `fixed_bill_payments` (is_paid, paid_date, amount_paid) e
recalcula Disponível/Comprometido imediatamente.

### 6.4 Limites semanais (dentro das categorias variáveis)

Barra "Semana atual: gasto X / limite Y — restam Z", com aviso ao atingir o limite.

### 6.5 Página REUNIÃO SEMANAL (`/weekly-review`)

Resumo derivado (sem novas tabelas além das já definidas):
- Quanto entrou esta semana
- Quanto gastámos
- Quanto sobrou
- Dentro do orçamento da semana? (por categoria)
- Já poupado este mês
- Navegação "Semana anterior / próxima".

## 7. Backend (familia-financas/backend/server.js)

Endpoints CRUD para `fixed_bills` e `fixed_bill_payments` (criar/editar/listar/marcar
pago), seguindo o padrão atual (Supabase service role + RLS por user). As fórmulas de
Disponível/Comprometido/semana podem ser calculadas no frontend a partir dos dados, ou
expostas por um endpoint de "resumo do mês" — decisão fina fica para o plano.

## 8. Seed

Ao ativar a funcionalidade, pré-criar contas fixas do orçamento recomendado
(Renda 700, Água+Luz+Gás 125, Internet+Telemóveis 50), editáveis depois. Opcional —
pode começar vazio se o usuário preferir.

## 9. Decisões confirmadas

- **Comprometido** = contas fixas do mês ainda não pagas.
- **Disponível** = saldo de conta corrente − comprometido (poupança fora).
- Abordagem **A** (tabelas dedicadas `fixed_bills` + `fixed_bill_payments`).
- Seed automático das contas fixas (editável).
- Semana = blocos de 7 dias a partir do dia 1.

## 10. Testes

- Unit: fórmulas (comprometido, disponível, limite/gasto/resta semanal, dias restantes).
- Integração: marcar conta como paga reduz comprometido e aumenta disponível.
- RLS: usuário só vê suas próprias contas fixas e pagamentos.
- Borda: mês com 5 blocos de semana; conta sem `category_id`; pagamento parcial.
