# Dockerfile para garantir uso de Node.js
FROM node:18-alpine

WORKDIR /app

# Copiar package.json primeiro (para cache de dependências)
# Se Root Directory estiver configurado como familia-financas/backend,
# o contexto já será esse diretório, então package.json está na raiz
COPY package.json ./

# Instalar dependências
RUN npm install

# Copiar todo o código restante
COPY . .

# Expor porta (Railway define PORT automaticamente via env)
EXPOSE 3000

# Comando para iniciar
CMD ["node", "server.js"]

