const path = require('path');
const axios = require('axios');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const qrcode = require('qrcode');
const { config } = require('../config/env');
const { logger } = require('../utils/logger');
const { saveMessageClassification } = require('./catalog');

let client = null;
let latestQr = null;
let isReady = false;

function getClientInstance() {
  if (client) return client;
  const puppeteerConfig = {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };
  // Resolve caminho do Chrome/Chromium
  if (config.chromeExecutablePath) {
    puppeteerConfig.executablePath = config.chromeExecutablePath;
  } else {
    try {
      const puppeteer = require('puppeteer');
      const execPath = puppeteer.executablePath();
      if (execPath && fs.existsSync(execPath)) {
        puppeteerConfig.executablePath = execPath;
      }
    } catch (e) {
      logger.warn('Puppeteer indisponível para resolver executablePath: %s', e.message);
    }
  }

  // Garante diretório de sessão
  try { fs.mkdirSync(config.sessionPath, { recursive: true }); } catch (_) {}
  client = new Client({
    authStrategy: new LocalAuth({ dataPath: config.sessionPath }),
    puppeteer: puppeteerConfig,
  });

  client.on('qr', async (qr) => {
    try {
      latestQr = await qrcode.toDataURL(qr);
      logger.info('QR code atualizado');
    } catch (err) {
      logger.error('Falha ao gerar QR: %s', err.message);
    }
  });

  client.on('ready', () => {
    isReady = true;
    logger.info('WhatsApp pronto.');
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    logger.warn('WhatsApp desconectado: %s', reason);
    // tenta reconectar automaticamente após alguns segundos
    setTimeout(() => {
      try {
        client.initialize();
      } catch (e) {
        logger.error('Falha ao reinicializar cliente: %s', e.message);
      }
    }, 5000);
  });

  client.on('auth_failure', (msg) => {
    logger.error('Falha de autenticação: %s', msg);
  });

  client.on('message', async (msg) => {
    try {
      if (msg.fromMe) return; // ignora mensagens enviadas por nós
      if (msg.from.endsWith('@g.us')) return; // ignora grupos neste MVP
      const text = msg.body || '';
      logger.info('Mensagem recebida de %s: %s', msg.from, text);

      // Classificar via serviço Python
      const { data } = await axios.post(`${config.pythonServiceUrl}/classify`, { text }).catch((e) => {
        logger.warn('Python classify indisponível: %s', e.message);
        return { data: { sentiment: 'neutral', matched_pattern: null, auto_reply: 'Obrigado pelo contato! Em que posso ajudar?' } };
      });
      const { sentiment, matched_pattern, auto_reply } = data;

      // Catalogar no Supabase
      await saveMessageClassification({ from: msg.from, body: text, sentiment, matched_pattern, direction: 'inbound', chat_id: msg.from });

      // Responder automaticamente para negativos e positivos
      if (sentiment === 'negative' || sentiment === 'positive') {
        await msg.reply(auto_reply);
        // registra saída
        await saveMessageClassification({ from: msg.to || 'self', to: msg.from, body: auto_reply, sentiment: 'neutral', matched_pattern: null, direction: 'outbound', chat_id: msg.from });
      }
    } catch (err) {
      logger.error('Erro ao processar mensagem recebida: %s', err.message);
    }
  });

  client.initialize().catch((err) => logger.error('Erro ao inicializar cliente WhatsApp: %s', err.message));
  return client;
}

function getQrCodeDataUrl() {
  return latestQr;
}

function getIsReady() {
  return isReady;
}

async function sendMessageToNumber(numberWithCountryCode, message) {
  const cli = getClientInstance();
  if (!isReady) throw new Error('Cliente WhatsApp não está pronto');
  const chatId = numberWithCountryCode.endsWith('@c.us')
    ? numberWithCountryCode
    : `${numberWithCountryCode.replace(/\D/g, '')}@c.us`;
  return cli.sendMessage(chatId, message);
}

async function sendMediaToNumber(numberOrChatId, filePath, caption) {
  const cli = getClientInstance();
  if (!isReady) throw new Error('Cliente WhatsApp não está pronto');
  const chatId = numberOrChatId.endsWith('@c.us')
    ? numberOrChatId
    : `${numberOrChatId.replace(/\D/g, '')}@c.us`;
  const media = await MessageMedia.fromFilePath(filePath);
  return cli.sendMessage(chatId, media, caption ? { caption } : {});
}

module.exports = { getClientInstance, getQrCodeDataUrl, getIsReady, sendMessageToNumber, sendMediaToNumber };


