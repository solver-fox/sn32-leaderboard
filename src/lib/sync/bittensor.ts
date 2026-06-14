import { ApiPromise, WsProvider } from '@polkadot/api';
import { fetchSn32EvalScores } from '@/lib/sync/wandb';

export interface SubnetMinerMetrics {
  uid: number;
  hotkey: string;
  rank: number | null;
  incentive: number;
  emission: number;
  trust: number;
  consensus: number;
  f1: number | null;
  precision: number | null;
  recall: number | null;
  fp: number | null;
  fn: number | null;
}

export interface ColdkeyBalances {
  taoBalance: number;
  alphaBalance: number;
  alphaStake: number;
}

const NETUID = parseInt(process.env.BITTENSOR_NETUID || '32', 10);
const RPC_URL = process.env.BITTENSOR_RPC_URL || 'wss://entrypoint-finney.opentensor.ai:443';
const SN32_METRICS_URL = process.env.SN32_METRICS_URL || '';
const DAILY_EMISSION_BLOCKS = 20;
const U16_MAX = 65535;
const RAO = 1_000_000_000;

let apiPromise: Promise<ApiPromise> | null = null;

async function getApi(): Promise<ApiPromise> {
  if (!apiPromise) {
    apiPromise = (async () => {
      const api = await ApiPromise.create({ provider: new WsProvider(RPC_URL) });
      await api.isReady;
      return api;
    })();
  }
  return apiPromise;
}

function normalizeAddress(address: string): string {
  return address.trim();
}

function normalizeKey(address: string): string {
  return normalizeAddress(address).toLowerCase();
}

function u16ToFloat(value: number): number {
  return value / U16_MAX;
}

function raoToTao(value: number): number {
  return value / RAO;
}

function computeRankByUid(incentive: number[], active: boolean[]): Array<number | null> {
  const rankByUid = new Array<number | null>(incentive.length).fill(null);
  incentive
    .map((value, uid) => ({ value, uid }))
    .filter(({ value, uid }) => active[uid] && value > 0)
    .sort((a, b) => b.value - a.value)
    .forEach(({ uid }, index) => {
      rankByUid[uid] = index + 1;
    });
  return rankByUid;
}

async function fetchOptionalSn32Metrics(): Promise<Map<string, Partial<SubnetMinerMetrics>>> {
  const map = new Map<string, Partial<SubnetMinerMetrics>>();
  if (!SN32_METRICS_URL) return map;

  try {
    const res = await fetch(SN32_METRICS_URL, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return map;
    const data = (await res.json()) as { miners?: SubnetMinerMetrics[] };
    for (const miner of data.miners ?? []) {
      map.set(normalizeKey(miner.hotkey), miner);
    }
  } catch {
    // Optional enrichment only
  }
  return map;
}

async function fetchSubnetArrays() {
  const api = await getApi();
  const q = api.query.subtensorModule;

  const [incentiveRaw, consensusRaw, emissionRaw, trustRaw, activeRaw] = await Promise.all([
    q.incentive(NETUID),
    q.consensus(NETUID),
    q.emission(NETUID),
    q.validatorTrust(NETUID),
    q.active(NETUID),
  ]);

  return {
    incentive: incentiveRaw.toJSON() as number[],
    consensus: consensusRaw.toJSON() as number[],
    emission: emissionRaw.toJSON() as number[],
    trust: trustRaw.toJSON() as number[],
    active: activeRaw.toJSON() as boolean[],
  };
}

export async function fetchMetricsForHotkeys(
  addresses: string[],
): Promise<Map<string, SubnetMinerMetrics>> {
  const unique = [...new Set(addresses.map(normalizeAddress))];
  if (unique.length === 0) return new Map();

  const api = await getApi();
  const q = api.query.subtensorModule;
  const [arrays, sn32Metrics, evalScores] = await Promise.all([
    fetchSubnetArrays(),
    fetchOptionalSn32Metrics(),
    fetchSn32EvalScores(),
  ]);
  const rankByUid = computeRankByUid(arrays.incentive, arrays.active);
  const metricsByHotkey = new Map<string, SubnetMinerMetrics>();

  for (const address of unique) {
    const uidRaw = await q.uids(NETUID, address);
    const uidValue = uidRaw.toJSON();
    if (uidValue === null || uidValue === undefined) continue;

    const uid = Number(uidValue);
    const sn32 = sn32Metrics.get(normalizeKey(address));
    const evalScore = evalScores.get(uid);
    const chainEmission = raoToTao(arrays.emission[uid] ?? 0) * DAILY_EMISSION_BLOCKS;

    metricsByHotkey.set(normalizeKey(address), {
      uid,
      hotkey: address,
      rank: evalScore?.rank ?? rankByUid[uid],
      incentive: u16ToFloat(arrays.incentive[uid] ?? 0),
      emission: chainEmission,
      trust: u16ToFloat(arrays.trust[uid] ?? 0),
      consensus: u16ToFloat(arrays.consensus[uid] ?? 0),
      f1: sn32?.f1 ?? evalScore?.f1 ?? null,
      precision: sn32?.precision ?? evalScore?.precision ?? null,
      recall: sn32?.recall ?? evalScore?.fpScore ?? null,
      fp: sn32?.fp ?? null,
      fn: sn32?.fn ?? null,
    });
  }

  return metricsByHotkey;
}

export async function fetchColdkeyBalances(address: string): Promise<ColdkeyBalances> {
  try {
    const api = await getApi();
    const account = await api.query.system.account(normalizeAddress(address));
    const free = BigInt(account.data.free.toString());

    return {
      taoBalance: Number(free) / RAO,
      alphaBalance: 0,
      alphaStake: 0,
    };
  } catch {
    return { taoBalance: 0, alphaBalance: 0, alphaStake: 0 };
  }
}

export function findMinerMetrics(
  metricsByHotkey: Map<string, SubnetMinerMetrics>,
  hotkeyAddress: string,
): SubnetMinerMetrics | undefined {
  return metricsByHotkey.get(normalizeKey(hotkeyAddress));
}
