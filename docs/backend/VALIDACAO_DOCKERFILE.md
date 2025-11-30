# Validação do Dockerfile

## ✅ Estrutura do Dockerfile

```dockerfile
FROM node:18-alpine          # Base image Node.js 18
WORKDIR /app                 # Define diretório de trabalho
COPY package.json ./         # Copia package.json para cache
RUN npm install              # Instala dependências
COPY . .                     # Copia todo o código
EXPOSE 3000                  # Expõe porta (Railway usa PORT env)
CMD ["node", "server.js"]    # Comando para iniciar
```

## ✅ Validação

### 1. Base Image
- ✅ Usa `node:18-alpine` (Node.js 18, imagem leve)
- ✅ Compatível com `package.json` que requer `node >= 18.0.0`

### 2. Dependências
- ✅ Copia `package.json` primeiro (otimiza cache do Docker)
- ✅ Instala dependências com `npm install`
- ✅ Todas as dependências necessárias estão no `package.json`:
  - express
  - cors
  - multer
  - @supabase/supabase-js
  - pdf-parse

### 3. Código
- ✅ Copia todo o código após instalar dependências
- ✅ `server.js` está presente e será executado

### 4. Porta
- ✅ Expõe porta 3000
- ✅ Railway define `PORT` via variável de ambiente
- ✅ Código usa `process.env.PORT || 3000`

### 5. Comando de Inicialização
- ✅ `CMD ["node", "server.js"]` executa o servidor
- ✅ Compatível com `package.json` que tem `"main": "server.js"`

## ⚠️ Requisitos do Railway

### Root Directory
**Deve estar configurado como:** `familia-financas/backend`

Isso garante que:
- O contexto do build seja `familia-financas/backend/`
- O `package.json` esteja na raiz do contexto
- O `Dockerfile` seja encontrado em `familia-financas/backend/Dockerfile`

### Dockerfile Path
**Deve estar configurado como:** `/familia-financas/backend/Dockerfile`

### Target Port
**Deve estar vazio** ou usar `$PORT`
- Railway define `PORT` automaticamente
- O código lê `process.env.PORT`

## ✅ Conclusão

O Dockerfile está **correto e completo**. Ele vai:
1. ✅ Instalar Node.js 18
2. ✅ Instalar todas as dependências
3. ✅ Copiar o código
4. ✅ Iniciar o servidor na porta correta
5. ✅ Funcionar com Railway quando Root Directory estiver configurado

## 🚀 Próximos Passos

1. Certifique-se de que **Root Directory** está como `familia-financas/backend`
2. Certifique-se de que **Dockerfile Path** está como `/familia-financas/backend/Dockerfile`
3. Faça push das mudanças
4. Aguarde o deploy no Railway
5. Teste: `https://minimax-familia-orcamento-production.up.railway.app/health`

