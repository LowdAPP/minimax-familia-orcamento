# Como Testar o Backend

## 1. Obter URL Pública

No Railway:
1. Vá em **Settings** do seu serviço
2. Role até **Networking**
3. Copie a **Public Domain** (ex: `seu-projeto.up.railway.app`)

## 2. Testar Health Check

```bash
curl https://seu-projeto.up.railway.app/health
```

Ou abra no navegador:
```
https://seu-projeto.up.railway.app/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T22:15:00.000Z"
}
```

## 3. Testar Processamento de PDF

```bash
curl -X POST https://seu-projeto.up.railway.app/api/process-pdf \
  -F "file=@../docs/Extrato\ empresa\ outubro.pdf" \
  -F "user_id=seu_user_id" \
  -F "account_id=seu_account_id"
```

## 4. Verificar Logs

No Railway:
1. Vá em **Deployments**
2. Clique no deployment mais recente
3. Veja os logs em tempo real

## URLs Importantes

- ❌ **URL Interna** (não funciona de fora): `https://minimax-familia-orcamento.railway.internal`
- ✅ **URL Pública** (use esta): `https://seu-projeto.up.railway.app`

## Troubleshooting

**Erro 404:**
- Verifique se o Root Directory está como `familia-financas/backend`
- Verifique se o serviço está rodando (veja logs)

**Erro 500:**
- Verifique as variáveis de ambiente (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- Veja os logs para mais detalhes

**Timeout:**
- Verifique se o PDF não é muito grande
- Verifique os logs para ver onde está travando

