#!/bin/bash
set -e
cd /workspace/familia-financas
echo "Iniciando build..."
pnpm run build
echo "Build concluído com sucesso!"
ls -lh dist/
