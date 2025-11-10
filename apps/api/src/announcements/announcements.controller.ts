import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { QueryAnnouncementDto } from './dto/query-announcement.dto';

@Controller('announcements')
@UseGuards(AuthGuard('jwt'))
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(req.user.tenantId, req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any, @Query() query: QueryAnnouncementDto) {
    return this.announcementsService.findAll(req.user.tenantId, query);
  }

  @Get('my')
  findMyAnnouncements(@Request() req: any) {
    return this.announcementsService.findMyAnnouncements(req.user.tenantId, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.announcementsService.findOne(id, req.user.tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementsService.update(id, req.user.tenantId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.announcementsService.remove(id, req.user.tenantId);
  }

  @Post(':id/notify')
  notify(@Param('id') id: string, @Request() req: any) {
    return this.announcementsService.notifyAnnouncement(id, req.user.tenantId);
  }
}
