// ============================================
// LOGGER — Winston (niveles) + stream para Morgan
// ============================================
import winston from 'winston';

const isProduction = process.env['NODE_ENV'] === 'production';

export const logger = winston.createLogger({
  // En dev queremos ver hasta las peticiones HTTP (nivel "http");
  // en producción solo lo importante, para no llenar los logs de ruido.
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
    // El archivo de errores solo se escribe en producción — en dev todo va por consola.
    ...(isProduction ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })] : []),
  ],
});

// Morgan no sabe qué es Winston — le damos un objeto con `.write()`
// para que cada línea de petición HTTP pase por el logger.http() de Winston.
export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};
