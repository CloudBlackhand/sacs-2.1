#!/bin/bash
set -e

echo "🚀 Iniciando SACS 2.1..."

# Configurações padrão se não existirem
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}
export PYTHON_SERVICE_URL=${PYTHON_SERVICE_URL:-http://127.0.0.1:8001}

echo "📦 Ambiente: NODE_ENV=$NODE_ENV, PORT=$PORT"
echo "🌐 URL Pública: Aguardando Railway configurar..."

# Inicia o servidor Python em background
echo "🐍 Iniciando servidor Python na porta 8001..."
cd /app/backend/python
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 &
PYTHON_PID=$!

# Aguarda Python iniciar
sleep 3

# Verifica se Python está rodando
if ! kill -0 $PYTHON_PID 2>/dev/null; then
    echo "❌ Erro: Python falhou ao iniciar"
    exit 1
fi

# Inicia o servidor Node.js na porta principal
echo "🟢 Iniciando servidor Node.js na porta $PORT..."
cd /app/backend/node

# Garante que Node escute na porta correta
export PORT=$PORT
node src/server.js &
NODE_PID=$!

# Aguarda Node iniciar
sleep 3

# Verifica se Node está rodando
if ! kill -0 $NODE_PID 2>/dev/null; then
    echo "❌ Erro: Node.js falhou ao iniciar"
    kill $PYTHON_PID 2>/dev/null || true
    exit 1
fi

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
echo "   📱 Frontend + API: http://0.0.0.0:$PORT"
echo "   🐍 Python API: http://0.0.0.0:8001 (interno)"
echo ""
echo "📌 Serviços disponíveis:"
echo "   - WhatsApp Web Integration"
echo "   - Excel Processing"
echo "   - Sentiment Analysis"
echo "   - Real-time Chat"
echo ""
echo "🔗 Aguardando URL pública do Railway..."

# Aguarda processos
wait $NODE_PID $PYTHON_PID