import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HotkeysService } from './hotkeys.service';
import { CreateHotkeyDto, UpdateHotkeyDto } from './dto/hotkey.dto';

@Controller('hotkeys')
@UseGuards(JwtAuthGuard)
export class HotkeysController {
  constructor(private hotkeysService: HotkeysService) {}

  @Get()
  findAll(@Req() req: { user: { userId: string } }) {
    return this.hotkeysService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.hotkeysService.findOne(req.user.userId, id);
  }

  @Post()
  create(@Req() req: { user: { userId: string } }, @Body() dto: CreateHotkeyDto) {
    return this.hotkeysService.create(req.user.userId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateHotkeyDto,
  ) {
    return this.hotkeysService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: { user: { userId: string } }, @Param('id') id: string) {
    return this.hotkeysService.remove(req.user.userId, id);
  }
}
