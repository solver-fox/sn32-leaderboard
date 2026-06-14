'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import {
  DEFAULT_PRICES,
  PRICE_REFRESH_MS,
  TokenField,
  TokenPrices,
  convertTokenAmount,
  formatMetric,
  formatTokenValue,
  getColumnLabel,
  getFieldLabel,
} from '@/lib/token-format';
import { useTokenUnitStore } from '@/store/token-unit';

export function useTokenMetrics() {
  const unit = useTokenUnitStore((s) => s.unit);
  const { data: prices = DEFAULT_PRICES } = useQuery({
    queryKey: ['prices'],
    queryFn: () => api.get<TokenPrices>('/prices'),
    staleTime: PRICE_REFRESH_MS,
    refetchInterval: PRICE_REFRESH_MS,
    refetchOnWindowFocus: true,
  });

  const format = (field: TokenField, amount: number | null | undefined) =>
    formatMetric(field, amount, unit, prices);

  const convert = (field: TokenField, amount: number) =>
    convertTokenAmount(field, amount, unit, prices);

  const fieldLabel = (field: TokenField) => getFieldLabel(unit, field);
  const columnLabel = (field: 'tao' | 'alpha' | 'stake') => getColumnLabel(unit, field);

  const unitSuffix = unit === 'usd' ? 'USD' : unit === 'tao' ? 'TAO' : 'Alpha';

  return {
    unit,
    prices,
    format,
    convert,
    fieldLabel,
    columnLabel,
    unitSuffix,
    formatRaw: (value: number, digits?: number) => formatTokenValue(value, unit, digits),
  };
}
