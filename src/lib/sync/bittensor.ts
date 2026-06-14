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
  weight: number | null;
  reward: number | null;
  stake: number | null;
  axonIp: string | null;
  axonPort: number | null;
  registeredBlock: number | null;
  registeredAt: Date | null;
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
const BLOCK_TIME_MS = 12_000;
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

function decodeAxonIp(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  try {
    const value = BigInt(String(raw).replace(/,/g, ''));
    if (value === 0n) return '0.0.0.0';
    const n = Number(value & 0xffffffffn);
    return `${(n >>> 24) & 0xff}.${(n >>> 16) & 0xff}.${(n >>> 8) & 0xff}.${n & 0xff}`;
  } catch {
    return null;
  }
}

function parseAxonInfo(raw: unknown): { ip: string | null; port: number | null } {
  if (!raw || typeof raw !== 'object') return { ip: null, port: null };
  const axon = raw as { ip?: unknown; port?: unknown };
  const port = axon.port != null ? Number(axon.port) : null;
  return { ip: decodeAxonIp(axon.ip), port: Number.isFinite(port) ? port : null };
}

async function fetchHotkeyAxonAndStake(
  q: Awaited<ReturnType<ApiPromise['query']>>['subtensorModule'],
  hotkey: string,
  uid: number,
): Promise<{ stake: number | null; axonIp: string | null; axonPort: number | null }> {
  try {
    const [alphaRaw] = await Promise.all([q.totalHotkeyAlpha(hotkey, NETUID)]);

    let axonJson: unknown = null;
    try {
      axonJson = (await q.axons(NETUID, hotkey)).toJSON();
    } catch {
      axonJson = (await q.axons(NETUID, uid)).toJSON();
    }

    const axon = parseAxonInfo(axonJson);
    const alphaValue = alphaRaw.toJSON();
    const stake =
      alphaValue !== null && alphaValue !== undefined ? raoToTao(Number(alphaValue)) : null;

    return { stake, axonIp: axon.ip, axonPort: axon.port };
  } catch {
    return { stake: null, axonIp: null, axonPort: null };
  }
}

async function fetchRegistrationInfo(
  api: ApiPromise,
  q: Awaited<ReturnType<ApiPromise['query']>>['subtensorModule'],
  uid: number,
): Promise<{ registeredBlock: number | null; registeredAt: Date | null }> {
  try {
    const regBlock = Number((await q.blockAtRegistration(NETUID, uid)).toJSON());
    if (!regBlock || regBlock <= 0) return { registeredBlock: null, registeredAt: null };

    const currentBlock = (await api.derive.chain.bestNumber()).toNumber();
    const blocksAgo = Math.max(0, currentBlock - regBlock);
    const registeredAt = new Date(Date.now() - blocksAgo * BLOCK_TIME_MS);

    return { registeredBlock: regBlock, registeredAt };
  } catch {
    return { registeredBlock: null, registeredAt: null };
  }
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
    const [axonStake, registration] = await Promise.all([
      fetchHotkeyAxonAndStake(q, address, uid),
      fetchRegistrationInfo(api, q, uid),
    ]);

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
      weight: evalScore?.weight ?? null,
      reward: evalScore?.reward ?? null,
      stake: axonStake.stake,
      axonIp: axonStake.axonIp,
      axonPort: axonStake.axonPort,
      registeredBlock: registration.registeredBlock,
      registeredAt: registration.registeredAt,
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
