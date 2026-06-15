# Sistema de Alertas - Família Finanças

## Visão Geral

O sistema de alertas visa notificar o usuário sobre situações financeiras importantes, como limites de orçamento excedidos, contas próximas do vencimento ou conquistas de economia.

## Componentes Envolvidos

### 1. Banco de Dados (Supabase)

*   **Tabela `alerts`**: Armazena as configurações de alertas ativos para o usuário.
    *   `user_id`: Vincula ao usuário.
    *   `alert_type`: Tipo do alerta (`envelope_limit`, `due_date`, `impulse_check`, `free_balance`).
    *   `message`: Mensagem personalizada.
    *   `is_active`: Se o alerta está habilitado.

*   **Tabela `alert_acknowledgments`**: Registra quando um usuário dispensa um alerta em um mês específico.
    *   `alert_type`: Código do alerta dispensado.
    *   `month_year`: Mês de referência (ex: "2023-11").
    *   **Lógica**: Se existir um registro aqui, o alerta desse tipo NÃO será exibido no Dashboard para aquele mês.

### 2. Frontend

#### `DashboardPage.tsx`
*   **Exibição**: Local onde os alertas são renderizados.
*   **Lógica (`loadAlerts`)**:
    1.  Calcula o mês atual (`YYYY-MM`).
    2.  Busca alertas dispensados em `alert_acknowledgments`.
    3.  Busca alertas configurados em `alerts`.
    4.  Filtra alertas do banco que já foram dispensados.
    5.  Se houver espaço (menos de 3 alertas), gera **Alertas Mock** baseados em regras de negócio locais (ex: gastos > 90% da renda).
*   **Interação**: O usuário pode clicar no "X" para dispensar. Isso insere um registro em `alert_acknowledgments` e remove o alerta da tela.

#### `SettingsPage.tsx`
*   **Configuração**: Permite ao usuário ativar/desativar categorias de alertas.
*   **Mapeamento**:
    *   Limite de Orçamento -> `envelope_limit`
    *   Lembrete de Contas -> `due_date`
    *   Gasto Incomum -> `impulse_check`
    *   Oportunidade de Economia -> `free_balance`
*   Ao salvar, o sistema desativa os alertas anteriores e cria novos registros na tabela `alerts`.

## Tipos de Alertas

| Código Frontend | Tipo Banco (`alerts`) | Descrição |
| :--- | :--- | :--- |
| `spending_limit_warning` | `envelope_limit` | Aviso de orçamento próximo do limite (90%) |
| `savings_success` | `free_balance` | Parabéns por ter saldo positivo (poupança) |
| `import_tip_info` | N/A (Mock) | Dica para importar extratos |
| N/A | `due_date` | Contas próximas do vencimento |
| N/A | `impulse_check` | Detecção de gastos incomuns |

## Fluxo de Dados

1.  **Usuário** acessa Dashboard.
2.  **Dashboard** consulta Supabase (`alerts` e `alert_acknowledgments`).
3.  **Lógica** combina dados do banco + regras locais (mocks).
4.  **Alertas** são exibidos.
5.  **Usuário** clica em "X" (Dispensar).
6.  **Frontend** salva em `alert_acknowledgments`.
7.  **Alerta** some até o próximo mês.

