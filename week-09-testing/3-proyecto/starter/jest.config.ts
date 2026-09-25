import type { Config } from 'jest';

const config: Config = {
  // ts-jest compila los tests (y el código que importan) desde TypeScript al vuelo.
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],

  // 1) setupFiles corre ANTES de importar cualquier archivo del test: pone las
  //    variables de entorno que config/env.ts exige al cargarse.
  setupFiles: ['<rootDir>/src/__tests__/setup/env.ts'],
  // 2) setupFilesAfterEnv corre justo antes de cada archivo de test (ya con Jest listo).
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/silenceLogger.ts'],

  // Limpia las llamadas registradas de cada mock entre tests: ningún test hereda
  // el historial del anterior.
  clearMocks: true,

  // La primera vez, mongodb-memory-server descarga un binario de MongoDB (~780 MB en Windows):
  // el límite de 10 minutos aplica también a beforeAll, donde se levanta la base.
  testTimeout: 600_000,

  // Cobertura: se mide todo el código de la app menos los archivos "de arranque"
  // (levantan el servidor o se corren a mano; no tienen lógica que probar).
  collectCoverageFrom: ['src/**/*.ts', '!src/**/__tests__/**', '!src/server.ts', '!src/seedAdmin.ts'],
  coverageThreshold: {
    global: { statements: 80, branches: 70, functions: 80, lines: 80 },
  },
};

export default config;
