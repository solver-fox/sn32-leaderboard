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
const PRICE_CACHE_MS = 60 * 1000;
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

function decodeAlphaRao(raw: unknown): number {
  if (raw === null || raw === undefined) return 0;

  const value = raw as { mantissa?: unknown; exponent?: unknown; bits?: unknown };
  if (value.mantissa != null && value.exponent != null) {
    const mantissa =
      typeof value.mantissa === 'string' && value.mantissa.startsWith('0x')
        ? BigInt(value.mantissa)
        : BigInt(String(value.mantissa).replace(/,/g, ''));
    const exponent = Number(value.exponent);
    if (!Number.isFinite(exponent)) return 0;
    return Number(mantissa) * 10 ** exponent;
  }

  if (value.bits != null) {
    const bits =
      typeof value.bits === 'string' && value.bits.startsWith('0x')
        ? BigInt(value.bits)
        : BigInt(String(value.bits).replace(/,/g, ''));
    return Number(bits);
  }

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
}

async function fetchColdkeyHotkeyStakeRao(
  q: Awaited<ReturnType<ApiPromise['query']>>['subtensorModule'],
  hotkey: string,
  coldkey: string,
): Promise<number> {
  try {
    const [alphaV2Raw, alphaRaw] = await Promise.all([
      q.alphaV2(hotkey, coldkey, NETUID),
      q.alpha(hotkey, coldkey, NETUID),
    ]);
    const v2 = decodeAlphaRao(alphaV2Raw.toJSON());
    const legacy = decodeAlphaRao(alphaRaw.toJSON());
    return Math.max(v2, legacy);
  } catch {
    return 0;
  }
}

async function fetchColdkeyStakeRao(
  q: Awaited<ReturnType<ApiPromise['query']>>['subtensorModule'],
  coldkey: string,
  hotkeyAddresses: string[],
): Promise<number> {
  if (hotkeyAddresses.length === 0) return 0;

  const stakes = await Promise.all(
    hotkeyAddresses.map((hotkey) => fetchColdkeyHotkeyStakeRao(q, hotkey, coldkey)),
  );
  return stakes.reduce((sum, stake) => sum + stake, 0);
}

function decodeAxonIp(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  try {
    const value = BigInt(String(raw).replace(/,/g, ''));
    if (value === BigInt(0)) return '0.0.0.0';
    const mask = BigInt('4294967295');
    const n = Number(value & mask);
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

export async function fetchColdkeyBalances(
  address: string,
  hotkeyAddresses: string[] = [],
): Promise<ColdkeyBalances> {
  try {
    const api = await getApi();
    const q = api.query.subtensorModule;
    const account = await api.query.system.account(normalizeAddress(address));
    const free = BigInt(account.data.free.toString());
    const uniqueHotkeys = [...new Set(hotkeyAddresses.map(normalizeAddress))];
    const alphaStakeRao = await fetchColdkeyStakeRao(q, normalizeAddress(address), uniqueHotkeys);

    return {
      taoBalance: Number(free) / RAO,
      alphaBalance: 0,
      alphaStake: alphaStakeRao / RAO,
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

let taoUsdCache: { value: number; expiresAt: number } | null = null;

export async function fetchTaoUsdPrice(): Promise<number> {
  if (taoUsdCache && taoUsdCache.expiresAt > Date.now()) {
    return taoUsdCache.value;
  }

  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bittensor&vs_currencies=usd',
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return taoUsdCache?.value ?? 0;
    const data = (await res.json()) as { bittensor?: { usd?: number } };
    const value = data.bittensor?.usd ?? 0;
    taoUsdCache = { value, expiresAt: Date.now() + PRICE_CACHE_MS };
    return value;
  } catch {
    return taoUsdCache?.value ?? 0;
  }
}

let alphaTaoCache: { value: number; expiresAt: number } | null = null;

function getRpcProvider(api: ApiPromise): WsProvider | null {
  const candidates = [
    api.connectProvider,
    (api as unknown as { _rpcCore?: { provider?: WsProvider } })._rpcCore?.provider,
  ];
  for (const provider of candidates) {
    if (provider && typeof provider.send === 'function') return provider;
  }
  return null;
}

export async function fetchAlphaTaoPrice(): Promise<number> {
  if (alphaTaoCache && alphaTaoCache.expiresAt > Date.now()) {
    return alphaTaoCache.value;
  }

  try {
    const api = await getApi();
    const provider = getRpcProvider(api);
    if (!provider) return alphaTaoCache?.value ?? 0;

    const result = await provider.send<string | number>('swap_currentAlphaPrice', [NETUID]);
    const rao = Number(result);
    if (!rao || rao <= 0) return alphaTaoCache?.value ?? 0;

    const value = rao / RAO;
    alphaTaoCache = { value, expiresAt: Date.now() + PRICE_CACHE_MS };
    return value;
  } catch {
    return alphaTaoCache?.value ?? 0;
  }
}
