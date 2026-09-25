// TESTS UNITARIOS — errorHandler (qué respuesta sale para cada tipo de error)
import { Request, Response } from 'express';
import { z } from 'zod';
import { errorHandler } from '../middlewares/errorHandler';
import { AppError } from '../errors/AppError';

const req = { method: 'GET', originalUrl: '/api/v1/prueba' } as Request;

// Un res falso: status() devuelve el mismo objeto para poder encadenar .json()
const fakeRes = () => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  return res as unknown as Response & typeof res;
};

const originalNodeEnv = process.env['NODE_ENV'];
afterEach(() => {
  process.env['NODE_ENV'] = originalNodeEnv; // limpia el estado global que cambian algunos tests
});

describe('errorHandler', () => {
  it('un ZodError responde 400 con la lista de issues', () => {
    const res = fakeRes();
    const zodError = z.object({ email: z.string() }).safeParse({}).error as z.ZodError;

    errorHandler(zodError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation Error', issues: [expect.objectContaining({ path: 'email' })] }),
    );
  });

  it('un JSON mal escrito en el body responde 400 (no 500)', () => {
    const res = fakeRes();
    const parseError = Object.assign(new SyntaxError('Unexpected token'), { type: 'entity.parse.failed' });

    errorHandler(parseError, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Bad Request', message: 'El cuerpo de la petición no es un JSON válido' });
  });

  it('un AppError responde con su propio status y mensaje', () => {
    const res = fakeRes();

    errorHandler(new AppError(404, 'Curso no encontrado'), req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not Found', message: 'Curso no encontrado' });
  });

  it('un error desconocido responde 500 y en desarrollo incluye el stack', () => {
    process.env['NODE_ENV'] = 'development';
    const res = fakeRes();

    errorHandler(new Error('boom'), req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Internal Server Error', stack: expect.any(String) }));
  });

  it('en PRODUCCIÓN el error 500 NO expone el stack', () => {
    process.env['NODE_ENV'] = 'production';
    const res = fakeRes();

    errorHandler(new Error('boom'), req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error', message: 'boom' });
  });
});
