import { NextRequest } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { getUserById } from '@/lib/services/auth.service';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const user = await getUserById(auth.sub);
  if (!user) return unauthorized();
  return Response.json(user);
}
