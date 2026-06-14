import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class BittensorService {
  private readonly logger = new Logger(BittensorService.name);
  private readonly sn32ApiUrl: string;

  constructor(config: ConfigService) {
    this.sn32ApiUrl = config.get('SN32_API_URL') || 'https://api.sn32.io';
  }

  async fetchSubnetMetrics(): Promise<SubnetMinerMetrics[]> {
    try {
      const res = await fetch(`${this.sn32ApiUrl}/v1/miners`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`SN32 API returned ${res.status}`);
      const data = (await res.json()) as { miners?: SubnetMinerMetrics[] };
      return data.miners ?? [];
    } catch (err) {
      this.logger.warn(`SN32 API unavailable, using empty metrics: ${(err as Error).message}`);
      return [];
    }
  }

  async fetchColdkeyBalances(address: string): Promise<ColdkeyBalances> {
    try {
      const res = await fetch(`${this.sn32ApiUrl}/v1/coldkeys/${address}/balances`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Balance API returned ${res.status}`);
      return (await res.json()) as ColdkeyBalances;
    } catch {
      this.logger.debug(`Balance fetch failed for ${address.slice(0, 8)}...`);
      return { taoBalance: 0, alphaBalance: 0, alphaStake: 0 };
    }
  }

  findMinerMetrics(miners: SubnetMinerMetrics[], hotkeyAddress: string): SubnetMinerMetrics | undefined {
    return miners.find((m) => m.hotkey === hotkeyAddress);
  }
}
