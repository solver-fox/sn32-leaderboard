import { AlertChannel, AlertType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export function listAlerts(userId: string) {
  return prisma.alert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export function createAlert(
  userId: string,
  data: {
    type: AlertType;
    channel: AlertChannel;
    threshold: number;
    destination: string;
    hotkeyId?: string;
  },
) {
  return prisma.alert.create({ data: { userId, ...data } });
}

export async function updateAlert(
  userId: string,
  id: string,
  data: { threshold?: number; destination?: string; enabled?: boolean },
) {
  const alert = await prisma.alert.findFirst({ where: { id, userId } });
  if (!alert) return null;
  return prisma.alert.update({ where: { id }, data });
}

export async function deleteAlert(userId: string, id: string) {
  const alert = await prisma.alert.findFirst({ where: { id, userId } });
  if (!alert) return null;
  return prisma.alert.delete({ where: { id } });
}
