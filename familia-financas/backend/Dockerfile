# Dockerfile para garantir uso de Node.js
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código
COPY . .

# Expor porta
EXPOSE 3000

# Comando para iniciar
CMD ["node", "server.js"]

