#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

# No Docker, dependências já são instaladas globalmente
python3 -m pip install --upgrade pip >/dev/null 2>&1 || true
pip3 install -r requirements.txt >/dev/null

exec uvicorn app.main:app --host 0.0.0.0 --port 8001


