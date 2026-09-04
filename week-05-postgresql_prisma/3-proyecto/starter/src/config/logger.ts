// ============================================
// LOGGER — Winston (niveles) + stream para Morgan
// ============================================
import winston from 'winston';

const isProduction = process.env['NODE_ENV'] === 'production';

export const logger = winston.createLogger({
  level: isProduction ? 'warn' : 'http',
  format: isProduction
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level}: ${message}`),
      ),
  transports: [
    new winston.transports.Console(),
    ...(isProduction ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })] : []),
  ],
});

export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};
