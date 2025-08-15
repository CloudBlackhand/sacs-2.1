#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
python -m pip install --upgrade pip >/dev/null 2>&1 || true
pip install -r requirements.txt >/dev/null

exec uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload


