# 🚂 Configuração Final do Railway

## ⚠️ IMPORTANTE: Configurações no Railway

### 1. Root Directory
**Configurar como:** `familia-financas/backend`

### 2. Builder
**Recomendado:** `Nixpacks` (mais simples para Node.js)

**Alternativa:** `Dockerfile` (se preferir usar Docker)

### 3. Se usar Nixpacks:
- ✅ Já tem `nixpacks.toml` configurado
- ✅ Já tem `Procfile` configurado
- ✅ Não precisa configurar nada extra

### 4. Se usar Dockerfile:
- ✅ Dockerfile está em `familia-financas/backend/Dockerfile`
- ⚠️ **IMPORTANTE:** O Root Directory DEVE ser `familia-financas/backend`
- ⚠️ O Dockerfile assume que o contexto de build é o diretório `backend`

### 5. Variáveis de Ambiente
Configurar no Railway:
- `SUPABASE_URL` = URL do seu projeto Supabase
- `SUPABASE_ANON_KEY` = Chave anônima do Supabase
- `PORT` = 3000 (ou deixar Railway definir automaticamente)

### 6. Port
**Target Port:** `3000`

### 7. Start Command
**Se usar Nixpacks:** Deixar vazio (usa o Procfile)
**Se usar Dockerfile:** Deixar vazio (usa o CMD do Dockerfile)

## 🔧 Resolução de Problemas

### Erro "Dockerfile:7"
- **Causa:** Root Directory não está configurado corretamente
- **Solução:** Configurar Root Directory como `familia-financas/backend`

### Erro "package.json not found"
- **Causa:** Contexto de build incorreto
- **Solução:** Verificar Root Directory

### Erro "connection refused"
- **Causa:** Servidor não está iniciando
- **Solução:** Verificar logs do Railway para ver erros de inicialização

## 📋 Checklist de Deploy

- [ ] Root Directory configurado: `familia-financas/backend`
- [ ] Builder configurado: `Nixpacks` ou `Dockerfile`
- [ ] Variáveis de ambiente configuradas
- [ ] Port configurado: `3000`
- [ ] Deploy realizado
- [ ] Health check funcionando: `GET /health`
- [ ] Testar upload de PDF: `POST /api/process-pdf`

