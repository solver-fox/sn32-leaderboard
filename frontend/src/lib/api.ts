const API_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}/api${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message || res.statusText, res.status);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Coldkey {
  id: string;
  address: string;
  label: string | null;
  taoBalance: number;
  alphaBalance: number;
  alphaStake: number;
  lastSyncAt: string | null;
  hotkeys?: Hotkey[];
  hotkeyCount?: number;
}

export interface Hotkey {
  id: string;
  address: string;
  label: string | null;
  uid: number | null;
  rank: number | null;
  incentive: number | null;
  emission: number | null;
  trust: number | null;
  consensus: number | null;
  f1: number | null;
  precision: number | null;
  recall: number | null;
  fp: number | null;
  fn: number | null;
  lastSyncAt: string | null;
  coldkey?: { id: string; label: string | null; address: string };
}

export interface LeaderboardItem {
  id: string;
  rank: number | null;
  hotkey: string;
  label: string | null;
  uid: number | null;
  f1: number | null;
  precision: number | null;
  recall: number | null;
  fp: number | null;
  fn: number | null;
  emission: number | null;
  incentive: number | null;
  lastUpdate: string | null;
  coldkeyLabel: string | null;
}

export interface PortfolioDashboard {
  coldkeySummary: {
    totalTao: number;
    totalAlpha: number;
    totalStake: number;
    dailyEmission: number;
    weeklyEmission: number;
    monthlyEmission: number;
    coldkeyCount: number;
  };
  hotkeySummary: {
    minerCount: number;
    bestMiner: { id: string; label: string | null; address: string; f1: number } | null;
    worstMiner: { id: string; label: string | null; address: string; f1: number } | null;
    averageF1: number | null;
    averageRank: number | null;
  };
  coldkeys: Coldkey[];
}

export interface MetricHistory {
  current: {
    rank: number | null;
    emission: number | null;
    incentive: number | null;
    f1: number | null;
    precision: number | null;
    recall: number | null;
    fp: number | null;
    fn: number | null;
  };
  history: Array<{
    timestamp: string;
    rank: number | null;
    emission: number | null;
    f1: number | null;
    precision: number | null;
    recall: number | null;
  }>;
}
