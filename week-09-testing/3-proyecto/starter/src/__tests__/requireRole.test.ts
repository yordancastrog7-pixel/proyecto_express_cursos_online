// TESTS UNITARIOS — requireRole (middleware de autorización)
// Se llama directo con req/res/next falsos: no hace falta un servidor.
import { Request, Response } from 'express';
import { requireRole } from '../middlewares/requireRole';
import { ROLES } from '../config/roles';

const run = (middleware: ReturnType<typeof requireRole>, user?: Request['user']) => {
  const next = jest.fn();
  middleware({ user } as Request, {} as Response, next);
  return next;
};

describe('requireRole', () => {
  it('sin sesión (req.user vacío) responde 401', () => {
    const next = run(requireRole(ROLES.ADMIN));

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('con un rol que no está permitido responde 403', () => {
    const next = run(requireRole(ROLES.ADMIN), { id: '1', role: ROLES.USER });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('con el rol permitido deja pasar (next sin error)', () => {
    const next = run(requireRole(ROLES.ADMIN), { id: '1', role: ROLES.ADMIN });

    expect(next).toHaveBeenCalledWith();
  });

  it('acepta varios roles a la vez', () => {
    const middleware = requireRole(ROLES.USER, ROLES.ADMIN);

    expect(run(middleware, { id: '1', role: ROLES.USER })).toHaveBeenCalledWith();
    expect(run(middleware, { id: '2', role: ROLES.ADMIN })).toHaveBeenCalledWith();
  });
});
