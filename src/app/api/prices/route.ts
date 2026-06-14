import { getTokenPrices } from '@/lib/services/prices.service';

export async function GET() {
  const prices = await getTokenPrices();
  return Response.json(prices);
}
