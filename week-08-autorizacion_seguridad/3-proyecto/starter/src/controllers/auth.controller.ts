// ============================================
// CONTROLLER — Auth (extrae → llama service → responde)
// ============================================
import { Request, Response, NextFunction } from 'express';
import * as service from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { REFRESH_COOKIE } from '../config/auth.config';
import { AppError } from '../errors/AppError';
import { zodErrorToResponse } from '../middlewares/errorHandler';
import { setAuthCookies, clearAuthCookies } from './auth.cookies';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json(zodErrorToResponse(result.error));
      return;
    }

    const user = await service.register(result.data);
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json(zodErrorToResponse(result.error));
      return;
    }

    const { user, tokens } = await service.login(result.data);

    // Los tokens viajan SOLO en cookies HttpOnly: el body no los incluye.
    setAuthCookies(res, tokens);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // authMiddleware ya validó el token y puso req.user; si no, la ruta no llegaría aquí.
    if (!req.user) {
      throw new AppError(401, 'No autenticado');
    }

    const user = await service.getProfile(req.user.id);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ data: await service.listUsers() });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    const tokens = await service.refresh(refreshToken);
    setAuthCookies(res, tokens);
    res.json({ data: { message: 'Sesión renovada' } });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    await service.logout(refreshToken);
    clearAuthCookies(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
