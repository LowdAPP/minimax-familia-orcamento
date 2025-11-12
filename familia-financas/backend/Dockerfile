# Dockerfile para garantir uso de Node.js
FROM node:18-alpine

WORKDIR /app

# Copiar package files primeiro (para cache de dependências)
COPY package.json ./

# Instalar dependências (incluindo devDependencies para build se necessário)
RUN npm install

# Copiar todo o código
COPY . .

# Expor porta (Railway define PORT automaticamente via env)
EXPOSE 3000

# Comando para iniciar
CMD ["node", "server.js"]

