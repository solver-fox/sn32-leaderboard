import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHotkeyDto, UpdateHotkeyDto } from './dto/hotkey.dto';

@Injectable()
export class HotkeysService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.hotkey.findMany({
      where: { coldkey: { userId } },
      include: { coldkey: { select: { id: true, label: true, address: true } } },
      orderBy: { rank: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const hotkey = await this.prisma.hotkey.findUnique({
      where: { id },
      include: {
        coldkey: { select: { id: true, label: true, address: true, userId: true } },
        metricSnapshots: { take: 500, orderBy: { timestamp: 'desc' } },
      },
    });
    if (!hotkey || hotkey.coldkey.userId !== userId) {
      throw new NotFoundException('Hotkey not found');
    }
    return hotkey;
  }

  async create(userId: string, dto: CreateHotkeyDto) {
    const coldkey = await this.prisma.coldkey.findUnique({ where: { id: dto.coldkeyId } });
    if (!coldkey || coldkey.userId !== userId) {
      throw new ForbiddenException('Invalid coldkey');
    }
    return this.prisma.hotkey.create({
      data: {
        coldkeyId: dto.coldkeyId,
        address: dto.address,
        label: dto.label,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateHotkeyDto) {
    await this.ensureOwnership(userId, id);
    if (dto.coldkeyId) {
      const coldkey = await this.prisma.coldkey.findUnique({ where: { id: dto.coldkeyId } });
      if (!coldkey || coldkey.userId !== userId) {
        throw new ForbiddenException('Invalid coldkey');
      }
    }
    return this.prisma.hotkey.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwnership(userId, id);
    return this.prisma.hotkey.delete({ where: { id } });
  }

  private async ensureOwnership(userId: string, id: string) {
    const hotkey = await this.prisma.hotkey.findUnique({
      where: { id },
      include: { coldkey: true },
    });
    if (!hotkey || hotkey.coldkey.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
