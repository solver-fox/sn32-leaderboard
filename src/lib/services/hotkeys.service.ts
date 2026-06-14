import { prisma } from '@/lib/prisma';

export async function listHotkeys(userId: string) {
  return prisma.hotkey.findMany({
    where: { coldkey: { userId } },
    include: { coldkey: { select: { id: true, label: true, address: true } } },
    orderBy: { rank: 'asc' },
  });
}

export async function getHotkey(userId: string, id: string) {
  const hotkey = await prisma.hotkey.findUnique({
    where: { id },
    include: {
      coldkey: { select: { id: true, label: true, address: true, userId: true } },
      metricSnapshots: { take: 500, orderBy: { timestamp: 'desc' } },
    },
  });
  if (!hotkey || hotkey.coldkey.userId !== userId) return null;
  return hotkey;
}

export async function createHotkey(
  userId: string,
  coldkeyId: string,
  address: string,
  label?: string,
) {
  const coldkey = await prisma.coldkey.findUnique({ where: { id: coldkeyId } });
  if (!coldkey || coldkey.userId !== userId) return null;
  return prisma.hotkey.create({ data: { coldkeyId, address, label } });
}

export async function updateHotkey(
  userId: string,
  id: string,
  data: { label?: string; coldkeyId?: string },
) {
  const hotkey = await prisma.hotkey.findUnique({
    where: { id },
    include: { coldkey: true },
  });
  if (!hotkey || hotkey.coldkey.userId !== userId) return null;

  if (data.coldkeyId) {
    const coldkey = await prisma.coldkey.findUnique({ where: { id: data.coldkeyId } });
    if (!coldkey || coldkey.userId !== userId) return null;
  }

  return prisma.hotkey.update({ where: { id }, data });
}

export async function deleteHotkey(userId: string, id: string) {
  const hotkey = await prisma.hotkey.findUnique({
    where: { id },
    include: { coldkey: true },
  });
  if (!hotkey || hotkey.coldkey.userId !== userId) return null;
  return prisma.hotkey.delete({ where: { id } });
}
