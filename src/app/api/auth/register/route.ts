import { NextRequest } from 'next/server';
import { registerUser, handleAuthError } from '@/lib/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;
    if (!email || !password || password.length < 8) {
      return Response.json({ message: 'Invalid input' }, { status: 400 });
    }
    const result = await registerUser(email, password, name);
    return Response.json(result);
  } catch (err) {
    return handleAuthError(err);
  }
}
