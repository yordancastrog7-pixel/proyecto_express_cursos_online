// TESTS UNITARIOS — config/env.ts (la app se niega a arrancar con una configuración insegura)
// env.ts valida al cargarse, así que cada test lo importa "de cero" con
// jest.isolateModules y con las variables de entorno que quiere probar.
const originalEnv = { ...process.env };

const loadEnv = () => {
  let loaded: typeof import('../config/env') | undefined;
  jest.isolateModules(() => {
    loaded = require('../config/env');
  });
  return loaded!.env;
};

afterEach(() => {
  process.env = { ...originalEnv }; // restaura las variables: ningún test contamina a otro
});

describe('config/env', () => {
  it('con una configuración válida expone los valores ya procesados', () => {
    process.env['CORS_ORIGINS'] = ' http://localhost:5173 , https://miapp.com ';

    const env = loadEnv();

    expect(env.corsOrigins).toEqual(['http://localhost:5173', 'https://miapp.com']);
    expect(env.isProduction).toBe(false);
  });

  it('falla si falta una variable obligatoria', () => {
    delete process.env['MONGODB_URI'];

    expect(loadEnv).toThrow('Falta la variable de entorno MONGODB_URI');
  });

  it('falla si un secreto tiene menos de 32 caracteres', () => {
    process.env['JWT_ACCESS_SECRET'] = 'corto';

    expect(loadEnv).toThrow('muy corto');
  });

  it('falla si un secreto conserva el valor de ejemplo de .env.example', () => {
    process.env['JWT_REFRESH_SECRET'] = 'cambia-esto-por-un-secreto-largo-y-aleatorio-para-refresh';

    expect(loadEnv).toThrow('valor de ejemplo');
  });

  it('falla si los dos secretos son iguales', () => {
    process.env['JWT_REFRESH_SECRET'] = process.env['JWT_ACCESS_SECRET'];

    expect(loadEnv).toThrow('DISTINTOS');
  });

  it('falla si CORS_ORIGINS incluye "*"', () => {
    process.env['CORS_ORIGINS'] = 'http://localhost:5173,*';

    expect(loadEnv).toThrow('no puede incluir "*"');
  });

  it('en producción isProduction es true', () => {
    process.env['NODE_ENV'] = 'production';

    expect(loadEnv().isProduction).toBe(true);
  });
});
