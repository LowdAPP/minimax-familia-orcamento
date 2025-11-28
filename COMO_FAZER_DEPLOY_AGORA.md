# 🚀 Como Fazer Deploy do Backend Corrigido - PASSO A PASSO

## ⚠️ Problema Identificado

O frontend está usando o **backend do Railway** (`/api/process-pdf`), não a Edge Function. Por isso, mesmo atualizando a Edge Function, ainda importa apenas 2 transações.

## ✅ Solução: Deploy do Backend no Railway

### Opção 1: Via Railway Dashboard (MAIS FÁCIL) ⭐

1. **Acesse o Railway Dashboard:**
   - Vá em https://railway.app
   - Faça login
   - Selecione o projeto do backend

2. **Verifique o serviço:**
   - Procure pelo serviço do backend (geralmente chamado "pdf-processor-backend" ou similar)
   - Clique nele

3. **Faça o deploy:**
   - Vá em **Settings** > **Source**
   - Se estiver conectado ao GitHub:
     - Vá no GitHub e faça commit + push do `server.js`
     - O Railway fará deploy automático
   - Se não estiver conectado:
     - Vá em **Deployments**
     - Clique em **Redeploy** (vai usar o código atual)

### Opção 2: Via GitHub (RECOMENDADO) ⭐⭐⭐

Se o Railway está conectado ao seu repositório GitHub:

```bash
# 1. Navegar para o diretório do projeto
cd /Users/lucasaraujo/Documents/react/minimax-familia-orcamento

# 2. Adicionar e commitar as mudanças
git add familia-financas/backend/server.js
git commit -m "fix: corrigir parser PDF para formato Santander PT com data duplicada sem espaço"

# 3. Fazer push
git push origin main

# 4. O Railway detectará automaticamente e fará deploy
```

**Aguarde 2-3 minutos** e o deploy será concluído automaticamente.

### Opção 3: Via Railway CLI (Se tiver acesso)

```bash
# 1. Navegar para o backend
cd familia-financas/backend

# 2. Fazer login (se necessário)
railway login

# 3. Conectar ao projeto (se necessário)
railway link

# 4. Fazer deploy
railway up
```

## 🧪 Como Verificar se Funcionou

Após o deploy:

1. **Aguarde 2-3 minutos** para o deploy concluir
2. **Teste novamente** com o PDF `ReceitasEmpresas.pdf`
3. **Verifique os logs** no Railway Dashboard:
   - Vá em **Deployments** > Clique no último deploy > **View Logs**
   - Procure por: `[PARSE] ✅ Usando padrão Santander PT - Data Duplicada Sem Espaço - 13 transações encontradas`

4. **Resultado esperado:**
   - ✅ **13 transações importadas** (não apenas 2)

## 🔍 Verificar Qual Backend Está Sendo Usado

No console do navegador (F12), quando fizer upload do PDF, você verá:

```
📤 Enviando PDF para backend: https://seu-backend.up.railway.app
```

Essa é a URL que precisa ter o código atualizado.

## 📝 Checklist

- [ ] Código `server.js` atualizado localmente ✅ (já feito)
- [ ] Edge Function atualizada ✅ (já feito, mas não está sendo usada)
- [ ] **Backend no Railway atualizado** ⚠️ (PRECISA FAZER)
- [ ] Teste após deploy
- [ ] Verificar logs no Railway

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs do Railway:**
   - Dashboard > Deployments > Logs
   - Procure por erros ou mensagens de parsing

2. **Verifique a URL do backend:**
   - No frontend, console do navegador
   - Confirme que está usando a URL correta do Railway

3. **Teste localmente primeiro:**
   ```bash
   cd familia-financas/backend
   node test-pdf.js
   ```
   Deve mostrar 13 transações.

4. **Verifique se o deploy foi concluído:**
   - Railway Dashboard > Deployments
   - Último deploy deve estar com status "SUCCESS"

## 💡 Dica

Se você não tem certeza de qual método usar, **recomendo a Opção 2 (GitHub)** - é a mais confiável e automática!

