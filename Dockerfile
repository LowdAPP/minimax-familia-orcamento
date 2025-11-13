FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY familia-financas/backend/package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm list

# Copy server code
COPY familia-financas/backend/server.js .
COPY familia-financas/backend/start.sh .

RUN chmod +x start.sh

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "server.js"]
