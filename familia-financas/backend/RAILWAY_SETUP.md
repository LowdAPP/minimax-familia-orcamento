# Railway Deployment Setup Guide

Este guia descreve como fazer o deploy do backend no Railway com as melhores práticas de 2024/2025.

## ✅ O Que Está Pronto

- **server.js**: Servidor Node.js minimalista e eficiente
- **Dockerfile**: Otimizado para Railway
- **railway.json**: Configuração automatizada
- **start.sh**: Script de inicialização que garante PORT

## 🚀 Passo a Passo de Deploy

### 1. Primeira Configuração no Railway Dashboard

1. Acesse [https://railway.com/project/25fcb98b-2af7-4f27-b4a4-1d58fda51579](https://railway.com/project/25fcb98b-2af7-4f27-b4a4-1d58fda51579)

2. Selecione o serviço **minimax-familia-orcamento**

3. Vá até a aba **Variables**

4. Clique em **New Variable** e adicione:

   ```
   Name: PORT
   Value: 3000
   ```

5. Também adicione as variáveis Supabase:

   ```
   Name: SUPABASE_URL
   Value: https://qkmuypctpuyoouqfatjf.supabase.co

   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 2. Configurar Health Check

1. Na aba **Settings** do serviço
2. Procure por **Healthcheck**
3. Adicione:
   - **Path**: `/health`
   - **Method**: `GET`
   - **Initial Delay**: 5 segundos
   - **Interval**: 30 segundos

### 3. Deploy Automático via GitHub

O deploy automático está habilitado. Sempre que você fazer push para a branch principal:

```bash
git push origin main
```

Railway vai:
1. Clonar o repositório
2. Fazer build do Dockerfile
3. Iniciar o container
4. Verificar health check
5. Rotear tráfego

## 📊 Verificando o Deploy

### Health Check Local

```bash
PORT=3000 npm start
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T10:30:45.123Z",
  "uptime": 1.5
}
```

### Health Check em Produção

```bash
curl https://minimax-familia-orcamento-production.up.railway.app/health
```

### Logs no Railway

```bash
railway logs
```

## 🔧 Troubleshooting

### Erro 502 Bad Gateway

**Causa:** PORT não definida ou servidor não respondendo

**Solução:**
1. Verifique se PORT=3000 está nas Variables
2. Revise a aba Logs para erros de inicialização
3. Teste localmente com `PORT=3000 npm start`

### Health Check Falhando

**Causa:** Servidor demora muito para iniciar ou endpoint /health com erro

**Solução:**
1. Aumente Initial Delay para 10 segundos
2. Verifique `server.js` - health check precisa responder com status 200

### Container Restartando

**Causa:** Aplicação crashando

**Solução:**
1. Verifique Railway Logs
2. Procure por erros de PORT binding
3. Confirme que todas as variáveis estão definidas

## 📈 Próximos Passos

- [ ] Implementar rate limiting
- [ ] Adicionar compressão de respostas
- [ ] Configurar CORS para domínio do frontend
- [ ] Implementar PDF parsing real
- [ ] Adicionar autenticação via Supabase JWT
- [ ] Configurar Prometheus para métricas

## 🔗 Referências

- [Railway Docs - Variables](https://docs.railway.com/guides/variables)
- [Railway Docs - Deploy Node.js API](https://docs.railway.com/guides/deploy-node-express-api-with-auto-scaling-secrets-and-zero-downtime)
- [Server.js Health Check Implementation](./server.js)

---

**Última atualização:** 13 de Novembro de 2025
