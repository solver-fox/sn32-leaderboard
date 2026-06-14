import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface LeaderboardQuery {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const SORT_FIELDS = ['uid', 'rank', 'f1', 'emission', 'incentive', 'precision', 'recall', 'stake', 'lastSyncAt'];

export async function getLeaderboard(userId: string, query: LeaderboardQuery) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip = (page - 1) * limit;
  const sortBy = SORT_FIELDS.includes(query.sortBy ?? '') ? query.sortBy! : 'rank';
  const sortOrder = query.sortOrder ?? 'asc';

  const where: Prisma.HotkeyWhereInput = {
    coldkey: { userId },
    ...(query.search
      ? {
          OR: [
            { address: { contains: query.search } },
            { label: { contains: query.search } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.HotkeyOrderByWithRelationInput | Prisma.HotkeyOrderByWithRelationInput[] =
    sortBy === 'rank'
      ? [{ rank: { sort: sortOrder, nulls: 'last' } }, { uid: 'asc' }]
      : { [sortBy]: sortOrder };

  const [items, total] = await Promise.all([
    prisma.hotkey.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: { coldkey: { select: { label: true, address: true } } },
    }),
    prisma.hotkey.count({ where }),
  ]);

  return {
    items: items.map((h) => ({
      id: h.id,
      rank: h.rank,
      hotkey: h.address,
      label: h.label,
      uid: h.uid,
      f1: h.f1 != null ? Number(h.f1) : null,
      precision: h.precision != null ? Number(h.precision) : null,
      recall: h.recall != null ? Number(h.recall) : null,
      fp: h.fp,
      fn: h.fn,
      emission: h.emission != null ? Number(h.emission) : null,
      incentive: h.incentive != null ? Number(h.incentive) : null,
      stake: h.stake != null ? Number(h.stake) : null,
      axonIp: h.axonIp,
      axonPort: h.axonPort,
      lastUpdate: h.lastSyncAt,
      coldkeyLabel: h.coldkey.label,
      coldkeyAddress: h.coldkey.address,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
