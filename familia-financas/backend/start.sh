#!/bin/sh
export PORT=${PORT:-3000}
echo "Starting server on port $PORT"
node /app/server.js
