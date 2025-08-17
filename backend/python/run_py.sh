#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# Verifica se está no Docker ou local
if [ -f /.dockerenv ]; then
    # No Docker, usa --break-system-packages
    python3 -m pip install --break-system-packages --upgrade pip >/dev/null 2>&1 || true
    pip3 install --break-system-packages -r requirements.txt >/dev/null 2>&1 || true
    exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001
else
    # Local - usa o ambiente virtual existente
    if [ -d "venv" ]; then
        source venv/bin/activate
        pip install --upgrade pip >/dev/null 2>&1 || true
        pip install -r requirements.txt >/dev/null 2>&1 || true
    else
        # Cria ambiente virtual se não existir
        python3 -m venv venv
        source venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
    fi
    exec uvicorn app.main:app --host 0.0.0.0 --port 8001
fi


