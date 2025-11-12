# Deploy no Railway - Passo a Passo

## 1. Preparar o Código

O backend está pronto em `familia-financas/backend/`

## 2. Criar Projeto no Railway

1. Acesse https://railway.app
2. Faça login (pode usar GitHub)
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"** (recomendado) ou **"Empty Project"**

## 3. Conectar Repositório (se usar GitHub)

1. Selecione seu repositório
2. Railway detectará automaticamente o Node.js
3. Configure o **Root Directory** como `familia-financas/backend`

## 4. Configurar Variáveis de Ambiente

No Railway, vá em **Variables** e adicione:

```
SUPABASE_URL=https://qkmuypctpuyoouqfatjf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**⚠️ IMPORTANTE:** Use a **SERVICE_ROLE_KEY**, não a anon key!

**Onde encontrar:**
- Dashboard Supabase: https://supabase.com/dashboard/project/qkmuypctpuyoouqfatjf
- Settings > API > service_role key

## 5. Deploy Automático

Railway fará deploy automaticamente quando você fizer push para o repositório.

Ou manualmente:
- Railway CLI: `railway up`
- Ou clique em **"Deploy"** no dashboard

## 6. Obter URL do Backend

Após o deploy, Railway fornecerá uma URL como:
```
https://seu-projeto.up.railway.app
```

## 7. Configurar Frontend

Adicione no `.env` do frontend:

```env
VITE_BACKEND_URL=https://seu-projeto.up.railway.app
```

Ou deixe vazio para usar `http://localhost:3000` em desenvolvimento.

## 8. Testar

1. Acesse a URL do backend + `/health`
   - Deve retornar: `{"status":"ok",...}`

2. Teste o upload de PDF no frontend
   - Deve processar e inserir transações

## Troubleshooting

**Erro: "SUPABASE_URL não configurado"**
- Verifique se as variáveis estão configuradas no Railway

**Erro: "Failed to fetch"**
- Verifique se a URL do backend está correta
- Verifique CORS (já configurado no código)

**Erro: "Permission denied"**
- Use SERVICE_ROLE_KEY, não ANON_KEY
- SERVICE_ROLE_KEY tem permissões para inserir dados

## Comandos Úteis

**Ver logs:**
```bash
railway logs
```

**Abrir shell:**
```bash
railway shell
```

**Ver variáveis:**
```bash
railway variables
```

