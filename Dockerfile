FROM node:18-alpine

WORKDIR /app

COPY familia-financas/backend/server.js .

EXPOSE 3000

CMD ["node", "server.js"]
