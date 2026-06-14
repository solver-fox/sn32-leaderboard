import { NextRequest } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { getSyncConfig, updateSyncInterval } from '@/lib/sync/runner';
import { rescheduleSync } from '@/lib/sync/scheduler';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const data = await getSyncConfig();
  return Response.json(data);
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const body = await req.json();
  try {
    const data = await updateSyncInterval(body.intervalMinutes);
    await rescheduleSync(body.intervalMinutes);
    return Response.json(data);
  } catch (err) {
    return Response.json(
      { message: err instanceof Error ? err.message : 'Invalid interval' },
      { status: 400 },
    );
  }
}
