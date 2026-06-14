import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function registerUser(email: string, password: string, name?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('CONFLICT:Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  return buildAuthResponse(user);
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) throw new Error('UNAUTHORIZED:Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('UNAUTHORIZED:Invalid credentials');

  return buildAuthResponse(user);
}

export async function findOrCreateGoogleUser(profile: {
  googleId: string;
  email: string;
  name?: string;
}) {
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
  });

  if (user && !user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: profile.googleId, name: user.name ?? profile.name },
    });
  } else if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        googleId: profile.googleId,
        name: profile.name,
      },
    });
  }

  return buildAuthResponse(user);
}

async function buildAuthResponse(user: { id: string; email: string; name: string | null }) {
  const token = await signToken({ sub: user.id, email: user.email });
  return {
    token,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
}

export function handleAuthError(err: unknown) {
  const message = err instanceof Error ? err.message : 'Authentication failed';
  if (message.startsWith('CONFLICT:')) {
    return Response.json({ message: message.slice(9) }, { status: 409 });
  }
  if (message.startsWith('UNAUTHORIZED:')) {
    return Response.json({ message: message.slice(13) }, { status: 401 });
  }
  return Response.json({ message: 'Authentication failed' }, { status: 500 });
}
