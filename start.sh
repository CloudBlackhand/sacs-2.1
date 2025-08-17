#!/bin/bash
set -e

echo "🚀 Iniciando SACS 2.1..."

# Configurações padrão se não existirem
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}
export PYTHON_SERVICE_URL=${PYTHON_SERVICE_URL:-http://127.0.0.1:8001}

echo "📦 Ambiente: NODE_ENV=$NODE_ENV, PORT=$PORT"

# Inicia o servidor Python em background
echo "🐍 Iniciando servidor Python..."
cd /app/backend/python
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 &
PYTHON_PID=$!

# Aguarda Python iniciar
sleep 3

# Inicia o servidor Node.js
echo "🟢 Iniciando servidor Node.js..."
cd /app/backend/node
node src/server.js &
NODE_PID=$!

# Função para limpar processos ao sair
cleanup() {
    echo "🛑 Encerrando servidores..."
    kill $PYTHON_PID $NODE_PID 2>/dev/null || true
    exit 0
}

# Registra handler de saída
trap cleanup SIGINT SIGTERM

# Mantém o script rodando
echo "✅ SACS 2.1 iniciado com sucesso!"
echo "   - Node.js: http://0.0.0.0:$PORT"
echo "   - Python: http://0.0.0.0:8001"

# Aguarda processos
wait $NODE_PID $PYTHON_PID