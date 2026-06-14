export interface Sn32EvalScore {
  uid: number;
  rank: number;
  reward: number;
  f1: number;
  precision: number;
  fpScore: number;
  weight: number;
}

interface WandbRunNode {
  name: string;
  state: string;
  createdAt: string;
  config: string;
}

interface WandbMinerMetric {
  uid: number;
  weight?: number;
  reward?: number;
  fp_score?: number;
  f1_score?: number;
  ap_score?: number;
}

interface WandbEvalPayload {
  timestamp?: number;
  uid_metrics?: Record<string, WandbMinerMetric>;
}

const WANDB_ENTITY = process.env.WANDB_ENTITY || 'itsai-dev';
const WANDB_PROJECT = process.env.WANDB_PROJECT || 'subnet32';
const MAIN_VALIDATOR_UID = parseInt(process.env.SN32_MAIN_VALIDATOR_UID || '222', 10);
const EVAL_LOOKBACK_DAYS = parseInt(process.env.SN32_EVAL_LOOKBACK_DAYS || '7', 10);

function parseRunConfig(config: string): { uid?: number } {
  try {
    const parsed = JSON.parse(config) as { uid?: { value?: number } };
    return { uid: parsed.uid?.value };
  } catch {
    return {};
  }
}

async function wandbGraphql<T>(query: string): Promise<T> {
  const res = await fetch('https://api.wandb.ai/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`WandB GraphQL failed: ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data as T;
}

async function listRecentRuns(limit = 30): Promise<WandbRunNode[]> {
  const data = await wandbGraphql<{
    project: { runs: { edges: Array<{ node: WandbRunNode }> } };
  }>(`query {
    project(name: "${WANDB_PROJECT}", entityName: "${WANDB_ENTITY}") {
      runs(first: ${limit}, order: "-created_at") {
        edges { node { name state createdAt config } }
      }
    }
  }`);
  return data.project.runs.edges.map((edge) => edge.node);
}

async function fetchRunSummary(runName: string): Promise<Record<string, unknown>> {
  const res = await fetch(
    `https://api.wandb.ai/files/${WANDB_ENTITY}/${WANDB_PROJECT}/${runName}/wandb-summary.json`,
    { signal: AbortSignal.timeout(20000), redirect: 'follow' },
  );
  if (!res.ok) throw new Error(`WandB summary failed: ${res.status}`);
  return (await res.json()) as Record<string, unknown>;
}

function computeRanks(metrics: WandbMinerMetric[]): Map<number, number> {
  const sorted = [...metrics].sort((a, b) => {
    const rewardDiff = (b.reward ?? 0) - (a.reward ?? 0);
    if (rewardDiff !== 0) return rewardDiff;
    return (b.f1_score ?? 0) - (a.f1_score ?? 0);
  });

  const ranks = new Map<number, number>();
  sorted.forEach((miner, index) => ranks.set(miner.uid, index + 1));
  return ranks;
}

function buildEvalMap(payload: WandbEvalPayload): Map<number, Sn32EvalScore> {
  const miners = Object.values(payload.uid_metrics ?? {});
  const ranks = computeRanks(miners);
  const scores = new Map<number, Sn32EvalScore>();

  for (const miner of miners) {
    scores.set(miner.uid, {
      uid: miner.uid,
      rank: ranks.get(miner.uid) ?? miners.length,
      reward: miner.reward ?? 0,
      f1: miner.f1_score ?? 0,
      precision: miner.ap_score ?? 0,
      fpScore: miner.fp_score ?? 0,
      weight: miner.weight ?? 0,
    });
  }

  return scores;
}

export async function fetchSn32EvalScores(): Promise<Map<number, Sn32EvalScore>> {
  try {
    const runs = await listRecentRuns();
    const cutoff = Date.now() - EVAL_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;

    for (const run of runs) {
      if (run.state !== 'finished') continue;
      const { uid } = parseRunConfig(run.config);
      if (uid !== MAIN_VALIDATOR_UID) continue;
      if (new Date(run.createdAt).getTime() < cutoff) continue;

      const summary = await fetchRunSummary(run.name);
      const original = summary.original_format_json;
      if (typeof original !== 'string') continue;

      const payload = JSON.parse(original) as WandbEvalPayload;
      if (!payload.uid_metrics) continue;

      return buildEvalMap(payload);
    }
  } catch (error) {
    console.error('[sync] Failed to fetch SN32 WandB eval scores:', error);
  }

  return new Map();
}

export function getSn32EvalScore(
  scores: Map<number, Sn32EvalScore>,
  uid: number,
): Sn32EvalScore | undefined {
  return scores.get(uid);
}
