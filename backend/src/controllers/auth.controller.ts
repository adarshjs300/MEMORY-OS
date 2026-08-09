import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import * as authService from '../services/auth.service';
import type { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AppError } from '../utils/AppError';

const REFRESH_COOKIE = 'dmos_refresh_token';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export async function register(req: Request<unknown, unknown, RegisterInput>, res: Response, next: NextFunction) {
  try {
    const { email, password, displayName } = req.body;
    const result = await authService.registerUser({
      email,
      password,
      displayName,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });

    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
    res.status(201).json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request<unknown, unknown, LoginInput>, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({
      email,
      password,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });

    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
    res.status(200).json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
    if (!token) throw AppError.unauthorized('No refresh token provided');

    const result = await authService.refreshTokens(token, req.ip, req.get('user-agent') ?? undefined);

    res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
    res.status(200).json({ user: result.user, accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] ?? req.body?.refreshToken;
    if (token) await authService.logoutUser(token);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) throw AppError.unauthorized();
    const user = await authService.getUserById(req.userId);
    if (!user) throw AppError.notFound('User not found');
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}
