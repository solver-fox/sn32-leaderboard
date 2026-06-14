import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-me-in-production',
);

export interface JwtPayload {
  sub: string;
  email: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  const match = expiresIn.match(/^(\d+)([dhms])$/);
  let expirationTime = '7d';
  if (match) {
    const [, num, unit] = match;
    expirationTime = `${num}${unit}`;
  }

  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub || typeof payload.email !== 'string') return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export async function getAuthUser(req: NextRequest): Promise<JwtPayload | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  return verifyToken(token);
}

export function unauthorized() {
  return Response.json({ message: 'Unauthorized' }, { status: 401 });
}

export function notFound(message = 'Not found') {
  return Response.json({ message }, { status: 404 });
}

export function badRequest(message: string) {
  return Response.json({ message }, { status: 400 });
}

export function conflict(message: string) {
  return Response.json({ message }, { status: 409 });
}
