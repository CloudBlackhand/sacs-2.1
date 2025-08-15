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

# Instala dependências Python
RUN pip3 install -r backend/python/requirements.txt || true

# Expõe a porta padrão do Node (ajuste se necessário)
EXPOSE 3000

# Inicia ambos os servidores (Node e Python)
CMD ["npx", "concurrently", "-k", "-n", "NODE,PY", "cd backend/node && npm start", "cd backend/python && bash run_py.sh"]
