#!/bin/bash

echo "🚀 Iniciando SACS localmente..."

# Verifica se o Node está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Instale primeiro: https://nodejs.org/"
    exit 1
fi

# Verifica se o Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não está instalado. Instale primeiro."
    exit 1
fi

# Instala dependências do Node se necessário
echo "📦 Instalando dependências Node.js..."
cd backend/node
if [ ! -d "node_modules" ]; then
    npm install
fi

# Configura Python com ambiente virtual
echo "🐍 Configurando Python..."
cd ../python
if [ ! -d "venv" ]; then
    echo "Criando ambiente virtual Python..."
    python3 -m venv venv
fi

# Ativa ambiente virtual e instala dependências
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Volta para a raiz
cd ../..

# Cria arquivo .env se não existir
if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cat > .env << 'EOF'
# Configuração básica
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Modo desenvolvimento (sem Supabase real)
DEV_FAKE_AUTH=1

# Python service
PYTHON_SERVICE_URL=http://127.0.0.1:8001

# Desabilita WhatsApp para testes
DISABLE_WHATSAPP=1
EOF
    echo "✅ Arquivo .env criado com configurações de desenvolvimento"
fi

echo ""
echo "🎯 Iniciando servidores..."
echo "   Node.js: http://localhost:3000"
echo "   Python:  http://localhost:8001"
echo ""
echo "📌 Use Ctrl+C para parar"
echo ""

# Inicia ambos os serviços
npx concurrently -k \
    -n "NODE,PYTHON" \
    -c "green,yellow" \
    "cd backend/node && npm start" \
    "cd backend/python && source venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload"