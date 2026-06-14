import { NextRequest } from 'next/server';
import { AlertChannel, AlertType } from '@prisma/client';
import { getAuthUser, unauthorized, notFound } from '@/lib/auth';
import { listAlerts, createAlert, updateAlert, deleteAlert } from '@/lib/services/alerts.service';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const data = await listAlerts(auth.sub);
  return Response.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const body = await req.json();
  if (!body.type || !body.channel || body.threshold === undefined || !body.destination) {
    return Response.json({ message: 'Invalid input' }, { status: 400 });
  }
  const data = await createAlert(auth.sub, {
    type: body.type as AlertType,
    channel: body.channel as AlertChannel,
    threshold: Number(body.threshold),
    destination: body.destination,
    hotkeyId: body.hotkeyId,
  });
  return Response.json(data, { status: 201 });
}
