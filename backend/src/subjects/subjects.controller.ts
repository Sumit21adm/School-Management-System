import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Controller('subjects')
export class SubjectsController {
    constructor(private readonly subjectsService: SubjectsService) { }

    @Get()
    getAll() {
        return this.subjectsService.getAll();
    }

    @Get(':id')
    getById(@Param('id', ParseIntPipe) id: number) {
        return this.subjectsService.getById(id);
    }

    @Post()
    create(@Body() dto: CreateSubjectDto) {
        return this.subjectsService.create(dto);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSubjectDto) {
        return this.subjectsService.update(id, dto);
    }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.subjectsService.delete(id);
    }
}
