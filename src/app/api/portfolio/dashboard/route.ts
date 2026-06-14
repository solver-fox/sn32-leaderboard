import { NextRequest } from 'next/server';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { getPortfolioDashboard } from '@/lib/services/portfolio.service';

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return unauthorized();
  const data = await getPortfolioDashboard(auth.sub);
  return Response.json(data);
}
