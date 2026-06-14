import { NextRequest } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import {
  listColdkeys,
  getColdkey,
  createColdkey,
  updateColdkey,
  deleteColdkey,
} from '@/lib/services/coldkeys.service';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const data = await listColdkeys(auth.sub);
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const body = await req.json();
  if (!body.address || body.address.length < 40) {
    return Response.json({ message: 'Invalid address' }, { status: 400 });
  }
  const data = await createColdkey(auth.sub, body.address, body.label);
  return Response.json(data, { status: 201 });
}
