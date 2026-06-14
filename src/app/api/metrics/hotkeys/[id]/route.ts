import { NextRequest } from 'next/server';
import { getAuthUser, unauthorized, notFound } from '@/lib/auth';
import { getHotkeyMetrics } from '@/lib/services/metrics.service';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const { id } = await params;
  const range = (req.nextUrl.searchParams.get('range') || '7d') as '24h' | '7d' | '30d' | '90d' | 'all';
  const data = await getHotkeyMetrics(auth.sub, id, range);
  if (!data) return notFound();
  return Response.json(data);
}
