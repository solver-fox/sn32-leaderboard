import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlertDto, UpdateAlertDto } from './dto/alert.dto';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.alert.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  create(userId: string, dto: CreateAlertDto) {
    return this.prisma.alert.create({
      data: {
        userId,
        type: dto.type,
        channel: dto.channel,
        threshold: dto.threshold,
        destination: dto.destination,
        hotkeyId: dto.hotkeyId,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateAlertDto) {
    const alert = await this.prisma.alert.findFirst({ where: { id, userId } });
    if (!alert) throw new NotFoundException('Alert not found');
    return this.prisma.alert.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    const alert = await this.prisma.alert.findFirst({ where: { id, userId } });
    if (!alert) throw new NotFoundException('Alert not found');
    return this.prisma.alert.delete({ where: { id } });
  }
}
