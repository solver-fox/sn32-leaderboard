export const PRICE_REFRESH_MS = 60 * 1000;

export type TokenUnit = 'tao' | 'usd' | 'alpha';

export type TokenField = 'tao' | 'alpha' | 'stake' | 'emission';

export interface TokenPrices {
  taoUsd: number;
  alphaTao: number;
  alphaUsd: number;
  updatedAt: string;
}

export const DEFAULT_PRICES: TokenPrices = {
  taoUsd: 0,
  alphaTao: 0,
  alphaUsd: 0,
  updatedAt: new Date(0).toISOString(),
};

const FIELD_LABELS: Record<TokenUnit, Record<TokenField, string>> = {
  tao: {
    tao: 'Total TAO',
    alpha: 'Total Alpha',
    stake: 'Total Stake',
    emission: 'Daily Emission',
  },
  usd: {
    tao: 'Total Balance',
    alpha: 'Alpha Balance',
    stake: 'Total Stake',
    emission: 'Daily Emission',
  },
  alpha: {
    tao: 'TAO (in α)',
    alpha: 'Total Alpha',
    stake: 'Total Stake',
    emission: 'Emission (α)',
  },
};

const COLUMN_LABELS: Record<TokenUnit, Record<'tao' | 'alpha' | 'stake', string>> = {
  tao: { tao: 'TAO', alpha: 'Alpha', stake: 'Stake' },
  usd: { tao: 'Balance ($)', alpha: 'Alpha ($)', stake: 'Stake ($)' },
  alpha: { tao: 'TAO (α)', alpha: 'Alpha', stake: 'Stake' },
};

function toTao(field: TokenField, amount: number, alphaTao: number): number {
  if (field === 'tao' || field === 'emission') return amount;
  return amount * alphaTao;
}

export function convertTokenAmount(
  field: TokenField,
  amount: number,
  unit: TokenUnit,
  prices: TokenPrices,
): number {
  const alphaTao = prices.alphaTao > 0 ? prices.alphaTao : 0.001;
  const taoUsd = prices.taoUsd > 0 ? prices.taoUsd : 0;

  if (unit === 'tao') {
    return toTao(field, amount, alphaTao);
  }

  if (unit === 'alpha') {
    const tao = toTao(field, amount, alphaTao);
    return tao / alphaTao;
  }

  const tao = toTao(field, amount, alphaTao);
  return tao * taoUsd;
}

export function formatTokenValue(
  value: number,
  unit: TokenUnit,
  digits?: number,
): string {
  if (unit === 'usd') {
    return value.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: digits ?? 2,
    });
  }
  const formatted = value.toLocaleString(undefined, {
    maximumFractionDigits: digits ?? unit === 'alpha' ? 2 : 4,
  });
  return unit === 'tao' ? `${formatted} τ` : `${formatted} α`;
}

export function getFieldLabel(unit: TokenUnit, field: TokenField): string {
  return FIELD_LABELS[unit][field];
}

export function getColumnLabel(unit: TokenUnit, field: 'tao' | 'alpha' | 'stake'): string {
  return COLUMN_LABELS[unit][field];
}

export function formatMetric(
  field: TokenField,
  amount: number | null | undefined,
  unit: TokenUnit,
  prices: TokenPrices,
): string {
  if (amount === null || amount === undefined) return '—';
  const converted = convertTokenAmount(field, amount, unit, prices);
  return formatTokenValue(converted, unit);
}
