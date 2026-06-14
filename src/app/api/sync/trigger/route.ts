import { NextRequest } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { runSyncJob } from '@/lib/sync/runner';

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const result = await runSyncJob();
  return Response.json({ status: 'completed', ...result });
}
