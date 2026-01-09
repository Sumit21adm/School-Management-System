import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { Prisma } from '@prisma/client';

@Controller('sections')
export class SectionsController {
    constructor(private readonly sectionsService: SectionsService) { }

    @Post()
    create(@Body() createSectionDto: Prisma.SectionCreateInput) {
        return this.sectionsService.create(createSectionDto);
    }

    @Get()
    findAll() {
        return this.sectionsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.sectionsService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSectionDto: Prisma.SectionUpdateInput) {
        return this.sectionsService.update(+id, updateSectionDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.sectionsService.remove(+id);
    }

    @Post(':id/assign-teacher')
    assignTeacher(
        @Param('id') id: string,
        @Body() body: { teacherId: number; sessionId: number }
    ) {
        return this.sectionsService.assignClassTeacher(+id, body.teacherId, body.sessionId);
    }

    @Post(':id/assign-subject-teacher')
    assignSubjectTeacher(
        @Param('id') id: string,
        @Body() body: { subjectId: number; teacherId: number; sessionId: number }
    ) {
        return this.sectionsService.assignSubjectTeacher(+id, body.subjectId, body.teacherId, body.sessionId);
    }
}
