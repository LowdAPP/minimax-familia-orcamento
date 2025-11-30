# Deploy da Correção do Parser de PDF

## 📋 Resumo

O parser de PDF foi corrigido para capturar **todas as 13 transações** do formato específico do Santander PT (data duplicada sem espaço).

**Antes:** 2 transações encontradas  
**Depois:** 13 transações encontradas ✅

## 🔧 Arquivos Atualizados

### 1. Backend (Railway) - **PRINCIPAL**
- **Arquivo:** `familia-financas/backend/server.js`
- **Mudança:** Adicionado padrão "Santander PT - Data Duplicada Sem Espaço" que processa linha por linha
- **Status:** ✅ Código atualizado localmente, precisa fazer deploy

### 2. Edge Function (Supabase) - **SECUNDÁRIO**
- **Arquivo:** `familia-financas/supabase/functions/pdf-parser/index.ts`
- **Mudança:** Mesmo padrão adicionado para manter consistência
- **Status:** ✅ Código atualizado localmente

## 🚀 Como Fazer Deploy

### Opção 1: Deploy Automático (se conectado ao GitHub)

Se o Railway está conectado ao seu repositório GitHub:

```bash
# 1. Fazer commit das mudanças
cd familia-financas/backend
git add server.js
git commit -m "fix: corrigir parser PDF para formato Santander PT com data duplicada sem espaço"
git push origin main

# 2. Railway fará deploy automaticamente
```

### Opção 2: Deploy Manual via Railway CLI

```bash
# 1. Instalar Railway CLI (se não tiver)
npm i -g @railway/cli

# 2. Fazer login
railway login

# 3. Navegar para o diretório do backend
cd familia-financas/backend

# 4. Fazer deploy
railway up
```

### Opção 3: Deploy via Railway Dashboard

1. Acesse https://railway.app
2. Selecione seu projeto
3. Vá em **Settings** > **Source**
4. Clique em **Redeploy** ou force um novo deploy

## 🧪 Teste Após Deploy

Após fazer o deploy, teste novamente com o PDF `ReceitasEmpresas.pdf`:

1. Acesse a aplicação
2. Vá em Transações > Upload PDF
3. Selecione o arquivo `ReceitasEmpresas.pdf`
4. Verifique se **13 transações** são importadas (não apenas 2)

## 📝 Formato do PDF Suportado

O parser agora suporta o formato específico do Santander PT onde:

```
Linha 1: 31-10-202531-10-2025  (data duplicada sem espaço)
Linha 2: TRF.IMED. DE WALQUIRIA CASSIANO O ABRUN-R4695333  (descrição)
Linha 3: + 180,00 EUR219,34 EUR  (valor e saldo juntos)
```

## ✅ Verificação

Após o deploy, você deve ver no log do Railway:

```
[PARSE] 🔍 Tentando padrão: Santander PT - Data Duplicada Sem Espaço
[PARSE] ✅ Usando padrão Santander PT - Data Duplicada Sem Espaço - 13 transações encontradas
```

## 🔍 Troubleshooting

Se ainda estiver importando apenas 2 transações:

1. **Verifique se o deploy foi concluído:**
   - Railway Dashboard > Deployments > Verificar último deploy
   
2. **Verifique os logs:**
   - Railway Dashboard > Logs > Verificar mensagens de parsing
   
3. **Teste localmente primeiro:**
   ```bash
   cd familia-financas/backend
   node test-pdf.js
   ```
   Deve mostrar 13 transações.

4. **Verifique a URL do backend:**
   - Frontend deve estar usando a URL correta do Railway
   - Variável `VITE_BACKEND_URL` deve estar configurada

## 📞 Suporte

Se o problema persistir após o deploy, verifique:
- Logs do Railway para erros
- Logs do frontend no console do navegador
- Formato exato do PDF (pode variar entre extratos)

