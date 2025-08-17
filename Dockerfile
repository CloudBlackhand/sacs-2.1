# Usa imagem com Chrome já instalado
FROM ghcr.io/puppeteer/puppeteer:latest

# Muda para root para instalar pacotes
USER root

# Instala Python e Node.js
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copia arquivos do projeto
COPY . .

# Instala dependências Node
RUN cd backend/node && npm install

# Cria ambiente virtual Python e instala dependências
RUN cd backend/python && \
    python3 -m venv venv && \
    . venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r requirements.txt

# Cria diretório para sessão do WhatsApp
RUN mkdir -p /app/.wwebjs_auth && chmod 777 /app/.wwebjs_auth

# Variáveis de ambiente padrão
ENV PORT=3000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Portas
EXPOSE 3000 8001

# Comando para iniciar
CMD ["sh", "-c", "cd backend/node && npm start & cd backend/python && . venv/bin/activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8001"]
