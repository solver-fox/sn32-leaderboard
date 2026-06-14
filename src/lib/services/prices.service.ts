import { fetchAlphaTaoPrice, fetchTaoUsdPrice } from '@/lib/sync/bittensor';
import { PRICE_REFRESH_MS, TokenPrices } from '@/lib/token-format';

let cache: { prices: TokenPrices; expiresAt: number } | null = null;

export async function getTokenPrices(): Promise<TokenPrices> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.prices;
  }

  const [taoUsd, alphaTao] = await Promise.all([fetchTaoUsdPrice(), fetchAlphaTaoPrice()]);
  const prices: TokenPrices = {
    taoUsd,
    alphaTao,
    alphaUsd: alphaTao * taoUsd,
    updatedAt: new Date().toISOString(),
  };

  cache = { prices, expiresAt: Date.now() + PRICE_REFRESH_MS };
  return prices;
}

/** Force next request to refetch prices (e.g. after interval tick). */
export function invalidatePriceCache() {
  cache = null;
}
