# 🚂 Setup Railway - Passo a Passo

## ✅ O que foi configurado

1. **railway.json** na raiz do projeto:
   - Builder: `NIXPACKS`
   - Start Command: `node server.js`

2. **nixpacks.toml** em `familia-financas/backend/`:
   - Node.js 18
   - npm install

3. **Procfile** em `familia-financas/backend/`:
   - `web: node server.js`

## 📋 Configurações no Railway Dashboard

### 1. Root Directory
**IMPORTANTE:** Configurar como `familia-financas/backend`

Como fazer:
1. Vá em Settings do serviço
2. Procure "Root Directory"
3. Digite: `familia-financas/backend`
4. Salve

### 2. Builder
✅ **Já configurado no railway.json como NIXPACKS**
- Não precisa alterar manualmente
- O Railway vai ler do `railway.json`

### 3. Variáveis de Ambiente
Configurar no Railway:
- `SUPABASE_URL` = URL do seu projeto Supabase
- `SUPABASE_ANON_KEY` = Chave anônima do Supabase
- `PORT` = Deixar Railway definir automaticamente (ou `3000`)

### 4. Port
**Target Port:** `3000`

## 🔄 Após fazer push

1. O Railway vai detectar o `railway.json` e usar Nixpacks
2. Vai procurar o código em `familia-financas/backend/`
3. Vai instalar dependências com `npm install`
4. Vai iniciar com `node server.js`

## ✅ Verificar se funcionou

1. **Health Check:**
   ```bash
   curl https://seu-projeto.up.railway.app/health
   ```
   Deve retornar: `{"status":"ok",...}`

2. **Logs do Railway:**
   - Deve aparecer: `✅ Servidor rodando na porta...`
   - Não deve ter erros de "package.json not found"

## 🐛 Problemas Comuns

### "package.json not found"
- **Solução:** Verificar se Root Directory está como `familia-financas/backend`

### "Builder não muda"
- **Solução:** O `railway.json` já está configurado. Fazer push e o Railway vai usar Nixpacks automaticamente

### "Connection refused"
- **Solução:** Verificar logs do Railway para ver erros de inicialização
