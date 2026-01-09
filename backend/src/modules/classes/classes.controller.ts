import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
    constructor(private readonly classesService: ClassesService) { }

    @Get()
    findAll() {
        return this.classesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.classesService.findOne(id);
    }


    @Post()
    @Roles('ADMIN', 'SUPER_ADMIN')
    create(@Body() createDto: { name: string; displayName: string; order?: number; capacity?: number }) {
        return this.classesService.create(createDto);
    }

    @Post('reorder')
    @Roles('ADMIN', 'SUPER_ADMIN')
    reorder(@Body() reorderDto: { items: { id: number; order: number }[] }) {
        return this.classesService.reorder(reorderDto.items);
    }

    @Put(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateDto: { name?: string; displayName?: string; capacity?: number; isActive?: boolean }
    ) {
        return this.classesService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.classesService.remove(id);
    }

    @Get(':id/subjects')
    getSubjects(@Param('id', ParseIntPipe) id: number) {
        return this.classesService.getSubjects(id);
    }

    @Post(':id/subjects')
    @Roles('ADMIN', 'SUPER_ADMIN')
    assignSubject(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: { subjectId: number; isCompulsory?: boolean; weeklyPeriods?: number; order?: number }
    ) {
        return this.classesService.assignSubject(id, dto);
    }

    @Delete(':id/subjects/:subjectId')
    @Roles('ADMIN', 'SUPER_ADMIN')
    removeSubject(
        @Param('id', ParseIntPipe) classId: number,
        @Param('subjectId', ParseIntPipe) subjectId: number
    ) {
        return this.classesService.removeSubject(classId, subjectId);
    }
}
