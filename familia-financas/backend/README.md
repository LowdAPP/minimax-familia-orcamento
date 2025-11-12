# Backend PDF Processor - Railway

Backend simples para processar PDFs de extratos bancários.

## Deploy no Railway

### 1. Criar projeto no Railway

1. Acesse https://railway.app
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Selecione "Deploy from GitHub repo" ou "Empty Project"

### 2. Configurar variáveis de ambiente

No Railway, vá em **Variables** e adicione:

```
SUPABASE_URL=https://qkmuypctpuyoouqfatjf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key
```

**Onde encontrar o SERVICE_ROLE_KEY:**
- Dashboard do Supabase > Settings > API
- Copie a "service_role" key (não a anon key!)

### 3. Deploy

**Opção A: Via GitHub**
1. Faça push deste diretório para um repositório GitHub
2. No Railway, conecte o repositório
3. Railway detectará automaticamente e fará deploy

**Opção B: Via Railway CLI**
```bash
railway login
railway init
railway up
```

### 4. Obter URL do backend

Após o deploy, Railway fornecerá uma URL como:
`https://seu-projeto.up.railway.app`

## Uso no Frontend

Atualize o `TransactionsPage.tsx` para usar o backend:

```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://seu-projeto.up.railway.app';

const formData = new FormData();
formData.append('file', file);
formData.append('user_id', user.id);
formData.append('account_id', accountId);

const response = await fetch(`${BACKEND_URL}/api/process-pdf`, {
  method: 'POST',
  body: formData
});
```

## Teste Local

```bash
cd backend
npm install
npm run dev
```

Teste com curl:
```bash
curl -X POST http://localhost:3000/api/process-pdf \
  -F "file=@../docs/Extrato\ empresa\ outubro.pdf" \
  -F "user_id=seu_user_id" \
  -F "account_id=seu_account_id"
```

## Endpoints

### GET /health
Health check do servidor

### POST /api/process-pdf
Processa PDF e insere transações no Supabase

**Body (multipart/form-data):**
- `file`: Arquivo PDF
- `user_id`: UUID do usuário
- `account_id`: UUID da conta

**Resposta:**
```json
{
  "success": true,
  "transactionsInserted": 87,
  "message": "87 transações importadas com sucesso",
  "preview": [...]
}
```

