const path = require('path');
const fs = require('fs');
const { createLogger, format, transports } = require('winston');

const logsDir = path.resolve(__dirname, '../../../logs');

// Garante que diretório de logs exista
try {
  fs.mkdirSync(logsDir, { recursive: true });
} catch (e) {}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'sacs-backend-node' },
  transports: [
    new transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logsDir, 'combined.log') }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

module.exports = { logger };


