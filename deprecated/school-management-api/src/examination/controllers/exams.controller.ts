import { Controller, Get, Post, Body, Put, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ExamsService } from '../services/exams.service';
import { CreateExamDto, UpdateExamDto, CreateExamScheduleDto } from '../dto/examination.dto';

@Controller('exams')
export class ExamsController {
    constructor(private readonly examsService: ExamsService) { }

    @Get()
    findAll(
        @Query('sessionId') sessionId?: string,
        @Query('status') status?: string,
    ) {
        const parsedSessionId = sessionId ? parseInt(sessionId) : undefined;
        return this.examsService.findAll(parsedSessionId, status);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.examsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateExamDto) {
        return this.examsService.create(dto);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExamDto) {
        return this.examsService.update(id, dto);
    }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.examsService.delete(id);
    }

    @Post(':id/schedule')
    addSchedule(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateExamScheduleDto
    ) {
        return this.examsService.addSchedule(id, dto);
    }

    @Delete('schedule/:scheduleId')
    deleteSchedule(@Param('scheduleId', ParseIntPipe) scheduleId: number) {
        return this.examsService.deleteSchedule(scheduleId);
    }
}
