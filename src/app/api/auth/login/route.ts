import { NextRequest } from 'next/server';
import { loginUser, handleAuthError } from '@/lib/services/auth.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return Response.json({ message: 'Invalid input' }, { status: 400 });
    }
    const result = await loginUser(email, password);
    return Response.json(result);
  } catch (err) {
    return handleAuthError(err);
  }
}
