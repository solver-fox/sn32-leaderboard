import { prisma } from '@/lib/prisma';

export async function getPortfolioDashboard(userId: string) {
  const coldkeys = await prisma.coldkey.findMany({
    where: { userId },
    include: { hotkeys: true },
  });

  const hotkeys = coldkeys.flatMap((c) => c.hotkeys);
  const totalTao = coldkeys.reduce((sum, c) => sum + Number(c.taoBalance), 0);
  const totalAlpha = coldkeys.reduce((sum, c) => sum + Number(c.alphaBalance), 0);
  const totalStake = coldkeys.reduce((sum, c) => sum + Number(c.alphaStake), 0);

  const emissions = hotkeys
    .map((h) => (h.emission ? Number(h.emission) : 0))
    .filter((e) => e > 0);

  const dailyEmission = emissions.reduce((a, b) => a + b, 0);
  const f1Values = hotkeys.map((h) => (h.f1 ? Number(h.f1) : null)).filter((v): v is number => v !== null);
  const ranks = hotkeys.map((h) => h.rank).filter((r): r is number => r !== null);

  const bestMiner = hotkeys.reduce<(typeof hotkeys)[0] | null>((best, h) => {
    if (!h.f1) return best;
    if (!best?.f1) return h;
    return Number(h.f1) > Number(best.f1) ? h : best;
  }, null);

  const worstMiner = hotkeys.reduce<(typeof hotkeys)[0] | null>((worst, h) => {
    if (!h.f1) return worst;
    if (!worst?.f1) return h;
    return Number(h.f1) < Number(worst.f1) ? h : worst;
  }, null);

  return {
    coldkeySummary: {
      totalTao,
      totalAlpha,
      totalStake,
      dailyEmission,
      weeklyEmission: dailyEmission * 7,
      monthlyEmission: dailyEmission * 30,
      coldkeyCount: coldkeys.length,
    },
    hotkeySummary: {
      minerCount: hotkeys.length,
      bestMiner: bestMiner
        ? { id: bestMiner.id, label: bestMiner.label, address: bestMiner.address, f1: Number(bestMiner.f1) }
        : null,
      worstMiner: worstMiner
        ? { id: worstMiner.id, label: worstMiner.label, address: worstMiner.address, f1: Number(worstMiner.f1) }
        : null,
      averageF1: f1Values.length ? f1Values.reduce((a, b) => a + b, 0) / f1Values.length : null,
      averageRank: ranks.length ? ranks.reduce((a, b) => a + b, 0) / ranks.length : null,
    },
    coldkeys: coldkeys.map((c) => ({
      id: c.id,
      address: c.address,
      label: c.label,
      taoBalance: Number(c.taoBalance),
      alphaBalance: Number(c.alphaBalance),
      alphaStake: Number(c.alphaStake),
      hotkeyCount: c.hotkeys.length,
      lastSyncAt: c.lastSyncAt,
    })),
  };
}
