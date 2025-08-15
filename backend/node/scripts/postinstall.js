/*
  Garante que o Chromium necessário pelo puppeteer/whatsapp-web.js exista
  e prepara diretórios persistentes no Railway.
*/
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (_) {}
}

try {
  const dataDir = fs.existsSync('/data') ? '/data' : null;
  if (dataDir) {
    ensureDir(path.join(dataDir, '.wwebjs_auth'));
    ensureDir(path.join(dataDir, '.cache'));
    process.env.PUPPETEER_CACHE_DIR = path.join(dataDir, '.cache');
  }

  // Se CHROME_PATH não estiver definido, força download do Chromium do puppeteer
  if (!process.env.CHROME_PATH && !process.env.PUPPETEER_EXECUTABLE_PATH && !process.env.GOOGLE_CHROME_BIN) {
    try {
      console.log('[postinstall] Baixando Chromium do puppeteer (se necessário)...');
      execSync('node -e "require(\'puppeteer\');"', { stdio: 'inherit' });
    } catch (e) {
      console.warn('[postinstall] Falha ao baixar Chromium automaticamente:', e.message);
    }
  }
} catch (err) {
  console.warn('[postinstall] Aviso:', err.message);
}



