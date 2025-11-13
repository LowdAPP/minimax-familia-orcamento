FROM node:18-alpine

LABEL maintainer="Familia Financas"
LABEL description="PDF Parser Backend with PDF Processing"

WORKDIR /app

# Copy package files
COPY familia-financas/backend/package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm list

# Copy server code
COPY familia-financas/backend/server.js .

EXPOSE 3000

CMD ["node", "server.js"]
