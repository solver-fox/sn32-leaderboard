import { NextRequest } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { listHotkeys, createHotkey } from '@/lib/services/hotkeys.service';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const data = await listHotkeys(auth.sub);
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const body = await req.json();
  if (!body.coldkeyId || !body.address || body.address.length < 40) {
    return Response.json({ message: 'Invalid input' }, { status: 400 });
  }
  const data = await createHotkey(auth.sub, body.coldkeyId, body.address, body.label);
  if (!data) return Response.json({ message: 'Invalid coldkey' }, { status: 403 });
  return Response.json(data, { status: 201 });
}
