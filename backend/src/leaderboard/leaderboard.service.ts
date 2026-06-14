import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardQuery {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(userId: string, query: LeaderboardQuery) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;
    const sortBy = this.validSortField(query.sortBy ?? 'rank');
    const sortOrder = query.sortOrder ?? 'asc';

    const where: Prisma.HotkeyWhereInput = {
      coldkey: { userId },
      ...(query.search
        ? {
            OR: [
              { address: { contains: query.search, mode: 'insensitive' } },
              { label: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.hotkey.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { coldkey: { select: { label: true, address: true } } },
      }),
      this.prisma.hotkey.count({ where }),
    ]);

    return {
      items: items.map((h) => ({
        id: h.id,
        rank: h.rank,
        hotkey: h.address,
        label: h.label,
        uid: h.uid,
        f1: h.f1 ? Number(h.f1) : null,
        precision: h.precision ? Number(h.precision) : null,
        recall: h.recall ? Number(h.recall) : null,
        fp: h.fp,
        fn: h.fn,
        emission: h.emission ? Number(h.emission) : null,
        incentive: h.incentive ? Number(h.incentive) : null,
        lastUpdate: h.lastSyncAt,
        coldkeyLabel: h.coldkey.label,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private validSortField(field: string): string {
    const allowed = ['rank', 'f1', 'emission', 'incentive', 'precision', 'recall', 'lastSyncAt'];
    return allowed.includes(field) ? field : 'rank';
  }
}
