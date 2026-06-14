import { NextRequest } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { getLeaderboard } from '@/lib/services/leaderboard.service';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();

  const { searchParams } = req.nextUrl;
  const data = await getLeaderboard(auth.sub, {
    search: searchParams.get('search') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
  });

  return Response.json(data);
}
