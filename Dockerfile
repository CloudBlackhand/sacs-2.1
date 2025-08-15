# Dockerfile para rodar Node.js e Python juntos no Railway
FROM node:20

# Instala Python, pip e utilitários necessários
RUN apt-get update && apt-get install -y python3 python3-pip procps

WORKDIR /app

# Copia todos os arquivos do projeto
COPY . .

# Instala dependências Node.js na raiz e no backend/node
RUN npm install || true
RUN cd backend/node && npm install || true

# Instala dependências Python (com --break-system-packages para evitar erro de ambiente gerenciado)
RUN pip3 install --break-system-packages --no-cache-dir --upgrade pip
RUN pip3 install --break-system-packages --no-cache-dir -r backend/python/requirements.txt

# Expõe as portas padrão do Node e do Python
EXPOSE 3000 8001

# Inicia ambos os servidores (Node e Python)
CMD ["npx", "concurrently", "-k", "-n", "NODE,PY", "cd backend/node && npm start", "cd backend/python && bash run_py.sh"]
