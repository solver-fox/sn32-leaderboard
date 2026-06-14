import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColdkeyDto, UpdateColdkeyDto } from './dto/coldkey.dto';

@Injectable()
export class ColdkeysService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.coldkey.findMany({
      where: { userId },
      include: { hotkeys: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const coldkey = await this.prisma.coldkey.findUnique({
      where: { id },
      include: { hotkeys: true, balanceSnapshots: { take: 30, orderBy: { timestamp: 'desc' } } },
    });
    if (!coldkey || coldkey.userId !== userId) {
      throw new NotFoundException('Coldkey not found');
    }
    return coldkey;
  }

  create(userId: string, dto: CreateColdkeyDto) {
    return this.prisma.coldkey.create({
      data: { userId, address: dto.address, label: dto.label },
    });
  }

  async update(userId: string, id: string, dto: UpdateColdkeyDto) {
    await this.ensureOwnership(userId, id);
    return this.prisma.coldkey.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.ensureOwnership(userId, id);
    return this.prisma.coldkey.delete({ where: { id } });
  }

  private async ensureOwnership(userId: string, id: string) {
    const coldkey = await this.prisma.coldkey.findUnique({ where: { id } });
    if (!coldkey || coldkey.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
