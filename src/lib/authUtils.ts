import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vending-secret-key-change-in-production';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function signToken(userId: string, email?: string): string {
  const payload: TokenPayload = {
    userId,
    email: email || '',
  };
  return sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function getUserIdFromToken(token: string): string | null {
  const payload = verifyToken(token);
  return payload?.userId || null;
}

