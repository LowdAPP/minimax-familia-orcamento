FROM node:18-alpine

WORKDIR /app

COPY familia-financas/backend/server.js .
COPY familia-financas/backend/start.sh .

RUN chmod +x /app/start.sh

EXPOSE 3000

CMD ["/bin/sh", "/app/start.sh"]
