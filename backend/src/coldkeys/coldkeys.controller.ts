import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ColdkeysService } from './coldkeys.service';
import { CreateColdkeyDto, UpdateColdkeyDto } from './dto/coldkey.dto';

@Controller('coldkeys')
@UseGuards(JwtAuthGuard)
export class ColdkeysController {
  constructor(private coldkeysService: ColdkeysService) {}

  @Get()
  findAll(@Req() req: { user: { userId: string } }) {
    return this.coldkeysService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.coldkeysService.findOne(req.user.userId, id);
  }

  @Post()
  create(@Req() req: { user: { userId: string } }, @Body() dto: CreateColdkeyDto) {
    return this.coldkeysService.create(req.user.userId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateColdkeyDto,
  ) {
    return this.coldkeysService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.coldkeysService.remove(req.user.userId, id);
  }
}
