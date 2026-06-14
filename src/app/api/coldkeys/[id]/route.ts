import { NextRequest } from 'next/server';
import { getAuthUser, unauthorized, notFound } from '@/lib/auth';
import { getColdkey, updateColdkey, deleteColdkey } from '@/lib/services/coldkeys.service';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const { id } = await params;
  const data = await getColdkey(auth.sub, id);
  if (!data) return notFound();
  return Response.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const { id } = await params;
  const body = await req.json();
  const data = await updateColdkey(auth.sub, id, body.label);
  if (!data) return notFound();
  return Response.json(data);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const { id } = await params;
  const data = await deleteColdkey(auth.sub, id);
  if (!data) return notFound();
  return Response.json(data);
}
