const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Carrega `.env` do backend se existir; senão, tenta na raiz `sacs/.env`
const candidateEnvPaths = [
  path.resolve(__dirname, '../../.env'), // sacs/backend/.env
  path.resolve(__dirname, '../../../.env'), // sacs/.env
];
for (const p of candidateEnvPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

// Detecta diretório persistente do Railway, se existir
const railwayDataDir = fs.existsSync('/data') ? '/data' : null;

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  pythonServiceUrl: process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8001',
  // Prioriza caminho definido; senão usa volume persistente '/data' do Railway; senão fallback local
  sessionPath: process.env.SESSION_PATH
    ? path.resolve(process.env.SESSION_PATH)
    : (railwayDataDir ? path.join(railwayDataDir, '.wwebjs_auth') : path.resolve(__dirname, '../../../.wwebjs_auth')),
  // Caminho opcional para Chrome/Chromium
  chromeExecutablePath: process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.GOOGLE_CHROME_BIN,
};

module.exports = { config };


