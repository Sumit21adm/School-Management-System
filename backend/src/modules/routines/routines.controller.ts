import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { Prisma } from '@prisma/client';

@Controller('routines')
export class RoutinesController {
    constructor(private readonly routinesService: RoutinesService) { }

    @Post()
    create(@Body() createRoutineDto: any) {
        return this.routinesService.create(createRoutineDto);
    }

    @Get()
    findAll(
        @Query('sectionId') sectionId?: string,
        @Query('teacherId') teacherId?: string
    ) {
        return this.routinesService.findAll(
            sectionId ? +sectionId : undefined,
            teacherId ? +teacherId : undefined
        );
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.routinesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateRoutineDto: Prisma.ClassRoutineUpdateInput) {
        return this.routinesService.update(id, updateRoutineDto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.routinesService.remove(id);
    }
}
