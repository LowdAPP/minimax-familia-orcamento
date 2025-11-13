# Teste do Fluxo de Importação de PDF

## Checklist de Validação

### 1. Backend está funcionando
- [ ] Servidor inicia sem erros
- [ ] Health check `/health` retorna 200
- [ ] Logs mostram "Servidor rodando"

### 2. Processamento de PDF
- [ ] Backend recebe FormData corretamente
- [ ] Extrai `user_id` e `account_id` do FormData
- [ ] Processa PDF e extrai texto
- [ ] Parseia transações do texto
- [ ] Converte datas para formato DATE (YYYY-MM-DD)
- [ ] Converte valores para DECIMAL
- [ ] Determina `transaction_type` baseado no sinal do amount
- [ ] Salva no Supabase com formato correto

### 3. Resposta do Backend
- [ ] Retorna `success: true` quando OK
- [ ] Retorna `transactionsFound` (número encontrado)
- [ ] Retorna `transactionsInserted` (número salvo)
- [ ] Retorna `databaseSave` com detalhes

### 4. Frontend processa resposta
- [ ] Lê `result.transactionsInserted`
- [ ] Mostra mensagem de sucesso
- [ ] Recarrega lista de transações
- [ ] Trata erros adequadamente

### 5. Integração Supabase
- [ ] Transações aparecem na tabela `transactions`
- [ ] Campos obrigatórios preenchidos: `user_id`, `account_id`, `transaction_date`, `amount`
- [ ] Campos opcionais: `description`, `merchant`, `transaction_type`, `status`, `source`
- [ ] RLS policies permitem inserção

## Como Testar

### Teste Local

1. Iniciar backend:
```bash
cd familia-financas/backend
npm install
SUPABASE_URL=... SUPABASE_ANON_KEY=... node server.js
```

2. Testar health check:
```bash
curl http://localhost:3000/health
```

3. Testar upload de PDF (usando o frontend ou curl):
```bash
curl -X POST http://localhost:3000/api/process-pdf \
  -F "file=@/caminho/para/extrato.pdf" \
  -F "user_id=UUID_DO_USUARIO" \
  -F "account_id=UUID_DA_CONTA"
```

### Teste no Frontend

1. Abrir página de transações
2. Clicar em "Importar PDF"
3. Selecionar arquivo PDF
4. Verificar logs no console
5. Verificar se transações aparecem na lista

## Problemas Comuns

### Backend não recebe FormData
- Verificar se Content-Type inclui boundary
- Verificar se parseMultipartFormData está funcionando

### Transações não são salvas
- Verificar se Supabase está configurado
- Verificar logs do backend para erros de inserção
- Verificar RLS policies

### Formato de data inválido
- Verificar se parseDate retorna YYYY-MM-DD
- Verificar formato da data no PDF

### Valores incorretos
- Verificar se parseAmount está convertendo corretamente
- Verificar se está usando vírgula ou ponto como decimal

