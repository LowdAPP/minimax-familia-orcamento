# Dockerfile para garantir uso de Node.js
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json primeiro para aproveitar cache do Docker
COPY package.json ./

# Instalar dependências
RUN npm install

# Copiar todo o código restante
COPY . .

# Expor porta (Railway define PORT via variável de ambiente)
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]

