FROM node:18-alpine

WORKDIR /app

COPY familia-financas/backend/server.js .

RUN echo "Dockerfile initialized at $(date)" && ls -la /app

EXPOSE 3000

CMD ["node", "server.js"]
