import { createApp } from './app.js';

const PORT = process.env.PORT ?? '3000';
const app = createApp();

const server = app.listen(Number(PORT), () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown: cierra el servidor de forma ordenada
// (deja de aceptar nuevas conexiones y termina las que ya están en curso)
function shutdown(signal: string): void {
  console.log(`\n${signal} recibido. Cerrando servidor...`);

  server.close(() => {
    console.log('Servidor cerrado correctamente.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));