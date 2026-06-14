export interface SubnetMinerMetrics {
  uid: number;
  hotkey: string;
  rank: number;
  incentive: number;
  emission: number;
  trust: number;
  consensus: number;
  f1: number;
  precision: number;
  recall: number;
  fp: number;
  fn: number;
}

export interface ColdkeyBalances {
  taoBalance: number;
  alphaBalance: number;
  alphaStake: number;
}

const sn32ApiUrl = process.env.SN32_API_URL || 'https://api.sn32.io';

export async function fetchSubnetMetrics(): Promise<SubnetMinerMetrics[]> {
  try {
    const res = await fetch(`${sn32ApiUrl}/v1/miners`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`SN32 API returned ${res.status}`);
    const data = (await res.json()) as { miners?: SubnetMinerMetrics[] };
    return data.miners ?? [];
  } catch {
    return [];
  }
}

export async function fetchColdkeyBalances(address: string): Promise<ColdkeyBalances> {
  try {
    const res = await fetch(`${sn32ApiUrl}/v1/coldkeys/${address}/balances`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Balance API returned ${res.status}`);
    return (await res.json()) as ColdkeyBalances;
  } catch {
    return { taoBalance: 0, alphaBalance: 0, alphaStake: 0 };
  }
}

export function findMinerMetrics(
  miners: SubnetMinerMetrics[],
  hotkeyAddress: string,
): SubnetMinerMetrics | undefined {
  return miners.find((m) => m.hotkey === hotkeyAddress);
}
