# Configuração do Railway - Passo a Passo

## ⚠️ Configurações Importantes

### 1. Root Directory
**Obrigatório!** Configure como:
```
familia-financas/backend
```

**Como configurar:**
- Settings > Source > Add Root Directory
- Digite: `familia-financas/backend`
- Salve

### 2. Builder
**Mude de Nixpacks para Dockerfile:**

**Como configurar:**
- Settings > Build > Builder
- Selecione **Dockerfile** (não Nixpacks)
- Ou deixe vazio para usar o Dockerfile automaticamente

### 3. Port
**NÃO configure porta fixa!**

O Railway define automaticamente a variável `PORT`. O código já usa:
```javascript
const PORT = process.env.PORT || 3000;
```

**Como configurar:**
- Settings > Networking > Target port
- **Deixe vazio** ou configure como variável `$PORT`
- NÃO use 8000 fixo

### 4. Start Command
**Configure como:**
```
node server.js
```

**Como configurar:**
- Settings > Deploy > Start Command
- Digite: `node server.js`
- Ou deixe vazio se usar o Dockerfile (já tem CMD definido)

### 5. Healthcheck Path (Opcional mas Recomendado)
```
/health
```

**Como configurar:**
- Settings > Deploy > Healthcheck Path
- Digite: `/health`

## ✅ Checklist de Configuração

- [ ] Root Directory: `familia-financas/backend`
- [ ] Builder: Dockerfile (ou vazio para auto-detect)
- [ ] Target Port: `$PORT` ou vazio (NÃO 8000)
- [ ] Start Command: `node server.js` (ou vazio se usar Dockerfile)
- [ ] Healthcheck Path: `/health` (opcional)
- [ ] Variáveis de ambiente:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`

## 🚨 Problemas Comuns

**Erro: "Deno detected"**
- Solução: Configure Root Directory como `familia-financas/backend`
- Ou force Dockerfile no Builder

**Erro: "Port already in use"**
- Solução: Remova a porta fixa (8000)
- Use `$PORT` ou deixe vazio

**Erro: "Cannot find module"**
- Solução: Verifique se Root Directory está correto
- Deve ser `familia-financas/backend` (não `familia-financas`)

## 📝 Configuração Recomendada Final

```
Root Directory: familia-financas/backend
Builder: Dockerfile
Target Port: (vazio ou $PORT)
Start Command: (vazio - usa Dockerfile CMD)
Healthcheck: /health
```

