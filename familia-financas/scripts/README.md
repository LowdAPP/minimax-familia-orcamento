# Scripts de Processamento

## process-pdf.js

Script para processar PDFs localmente e enviar transações para Supabase.

### Instalação

Primeiro, instale as dependências:

```bash
cd familia-financas
pnpm add pdf-parse dotenv
# ou
npm install pdf-parse dotenv
```

### Uso

#### 1. Apenas processar e ver preview (sem enviar para BD)

```bash
node scripts/process-pdf.js "../docs/Extrato empresa outubro.pdf"
```

Isso vai:
- Extrair texto do PDF
- Parsear transações
- Mostrar preview
- Salvar em `transactions.json`

#### 2. Processar e enviar para Supabase

```bash
node scripts/process-pdf.js "../docs/Extrato empresa outubro.pdf" <user_id> <account_id>
```

Onde:
- `<user_id>`: UUID do usuário no Supabase
- `<account_id>`: UUID da conta no Supabase

### Exemplo Completo

```bash
# 1. Primeiro, apenas processar para ver o resultado
node scripts/process-pdf.js "../docs/Extrato empresa outubro.pdf"

# 2. Se estiver correto, enviar para a base de dados
node scripts/process-pdf.js "../docs/Extrato empresa outubro.pdf" \
  f4c4b461-f1e1-4285-9198-991c9a821114 \
  ab86f58f-13be-481d-b2f2-cab3167e1d75
```

### Variáveis de Ambiente

Certifique-se de que o arquivo `.env` contém:

```env
VITE_SUPABASE_URL=https://qkmuypctpuyoouqfatjf.supabase.co
VITE_SUPABASE_ANON_KEY=seu_anon_key_aqui
```

### Saída

O script mostra:
- Quantidade de texto extraído
- Número de transações encontradas
- Preview das primeiras 5 transações
- Progresso da inserção (se enviando para BD)
- Resultado final

### Troubleshooting

**Erro: "pdf-parse não está instalado"**
```bash
pnpm add pdf-parse
```

**Erro: "Variáveis de ambiente não configuradas"**
- Verifique se o arquivo `.env` existe
- Verifique se contém `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

**Nenhuma transação encontrada**
- O script mostrará as primeiras 10 linhas do texto extraído
- Verifique se o formato do PDF é suportado
- Pode ser necessário ajustar os padrões de parsing no script

