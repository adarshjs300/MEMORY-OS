import crypto from 'node:crypto';
import { query, withTransaction } from '../db/pool';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import { toPublicUser, type UserRecord, type PublicUser } from '../types/auth';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshExpiryDate(): Date {
  // Parses simple durations like "7d", "15m", "1h". Falls back to 7 days.
  const match = env.JWT_REFRESH_EXPIRES_IN.match(/^(\d+)([smhd])$/);
  const now = Date.now();
  if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
  const value = Number(match[1]);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2] as 's' | 'm' | 'h' | 'd'];
  return new Date(now + value * unitMs);
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

interface RegisterParams {
  email: string;
  password: string;
  displayName: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function registerUser(params: RegisterParams): Promise<AuthResult> {
  const existing = await query<UserRecord>('SELECT id FROM users WHERE email = $1', [params.email]);
  if (existing.rowCount && existing.rowCount > 0) {
    throw AppError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(params.password);

  const result = await withTransaction(async (client) => {
    const insertUser = await client.query<UserRecord>(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [params.email, passwordHash, params.displayName]
    );
    const user = insertUser.rows[0];

    await client.query(
      `INSERT INTO audit_logs (user_id, action, metadata, ip_address)
       VALUES ($1, 'user.registered', $2, $3)`,
      [user.id, JSON.stringify({ email: user.email }), params.ipAddress ?? null]
    );

    return user;
  });

  return issueTokenPair(result, params.ipAddress, params.userAgent);
}

interface LoginParams {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function loginUser(params: LoginParams): Promise<AuthResult> {
  const result = await query<UserRecord>(
    'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
    [params.email]
  );
  const user = result.rows[0];

  // Constant-shape response whether the user exists or not, to avoid
  // leaking which emails are registered via timing/response differences.
  if (!user) {
    await hashPassword(params.password); // burn roughly the same time as a real verify
    throw AppError.unauthorized('Invalid email or password');
  }

  const valid = await verifyPassword(params.password, user.password_hash);
  if (!valid) {
    await query(
      `INSERT INTO audit_logs (user_id, action, metadata, ip_address)
       VALUES ($1, 'auth.login_failed', '{}'::jsonb, $2)`,
      [user.id, params.ipAddress ?? null]
    );
    throw AppError.unauthorized('Invalid email or password');
  }

  await query(
    `INSERT INTO audit_logs (user_id, action, metadata, ip_address)
     VALUES ($1, 'auth.login_success', '{}'::jsonb, $2)`,
    [user.id, params.ipAddress ?? null]
  );

  return issueTokenPair(user, params.ipAddress, params.userAgent);
}

async function issueTokenPair(
  user: UserRecord,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResult> {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });

  const rawRefreshId = crypto.randomUUID();
  const refreshToken = signRefreshToken({ sub: user.id, tokenId: rawRefreshId });

  await query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [rawRefreshId, user.id, hashToken(refreshToken), refreshExpiryDate(), ipAddress ?? null, userAgent ?? null]
  );

  return { user: toPublicUser(user), accessToken, refreshToken };
}

/**
 * Rotates a refresh token: validates it, revokes it, and issues a new pair.
 * If a token that was already revoked is presented again, that's a strong
 * signal of theft/replay — every token for that user is revoked immediately.
 */
export async function refreshTokens(
  refreshToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthResult> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);

  const record = await query<{
    id: string;
    user_id: string;
    token_hash: string;
    revoked_at: string | null;
    expires_at: string;
  }>('SELECT * FROM refresh_tokens WHERE id = $1', [payload.tokenId]);
  const row = record.rows[0];

  if (!row || row.token_hash !== tokenHash) {
    throw AppError.unauthorized('Invalid refresh token');
  }

  if (row.revoked_at) {
    // Reuse of a revoked token — possible theft. Nuke the whole session tree.
    await query('UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [
      row.user_id,
    ]);
    await query(
      `INSERT INTO audit_logs (user_id, action, metadata, ip_address)
       VALUES ($1, 'auth.refresh_token_reuse_detected', '{}'::jsonb, $2)`,
      [row.user_id, ipAddress ?? null]
    );
    throw AppError.unauthorized('Session invalidated — please log in again');
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw AppError.unauthorized('Refresh token expired');
  }

  const userResult = await query<UserRecord>('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [
    row.user_id,
  ]);
  const user = userResult.rows[0];
  if (!user) throw AppError.unauthorized('User not found');

  const newPair = await issueTokenPair(user, ipAddress, userAgent);

  await query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [row.id]);

  return newPair;
}

export async function logoutUser(refreshToken: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(refreshToken);
    await query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1 AND revoked_at IS NULL', [
      payload.tokenId,
    ]);
  } catch {
    // Already invalid/expired — logout is idempotent, nothing to do.
  }
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
  const result = await query<UserRecord>('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [
    userId,
  ]);
  const user = result.rows[0];
  return user ? toPublicUser(user) : null;
}
