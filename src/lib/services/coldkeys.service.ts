import { prisma } from '@/lib/prisma';

export function listColdkeys(userId: string) {
  return prisma.coldkey.findMany({
    where: { userId },
    include: { hotkeys: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getColdkey(userId: string, id: string) {
  const coldkey = await prisma.coldkey.findUnique({
    where: { id },
    include: { hotkeys: true, balanceSnapshots: { take: 30, orderBy: { timestamp: 'desc' } } },
  });
  if (!coldkey || coldkey.userId !== userId) return null;
  return coldkey;
}

export function createColdkey(userId: string, address: string, label?: string) {
  return prisma.coldkey.create({
    data: { userId, address, label },
  });
}

export async function updateColdkey(userId: string, id: string, label?: string) {
  const coldkey = await prisma.coldkey.findUnique({ where: { id } });
  if (!coldkey || coldkey.userId !== userId) return null;
  return prisma.coldkey.update({ where: { id }, data: { label } });
}

export async function deleteColdkey(userId: string, id: string) {
  const coldkey = await prisma.coldkey.findUnique({ where: { id } });
  if (!coldkey || coldkey.userId !== userId) return null;
  return prisma.coldkey.delete({ where: { id } });
}
