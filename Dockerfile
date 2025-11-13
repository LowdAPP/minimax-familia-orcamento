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
COPY familia-financas/backend/start.sh .

# Force rebuild with timestamp
ENV BUILD_TIMESTAMP=2025-11-13T17:25:00Z

RUN chmod +x start.sh

EXPOSE 3000

CMD ["node", "server.js"]
