# Dockerfile para garantir uso de Node.js
FROM node:18-alpine

WORKDIR /app

# Verificar se package.json existe (debug)
RUN ls -la /app || echo "Diretório vazio"

# Copiar package files primeiro (para cache de dependências)
# Usar caminho absoluto relativo ao contexto
COPY ./package.json ./

# Verificar se foi copiado
RUN ls -la package.json || (echo "ERRO: package.json não encontrado" && exit 1)

# Instalar dependências
RUN npm install

# Copiar todo o código restante
COPY . .

# Expor porta (Railway define PORT automaticamente via env)
EXPOSE 3000

# Comando para iniciar
CMD ["node", "server.js"]

