import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { SubjectsService } from '../services/subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from '../dto/examination.dto';

@Controller('subjects')
export class SubjectsController {
    constructor(private readonly subjectsService: SubjectsService) { }

    @Get()
    findAll() {
        return this.subjectsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.subjectsService.findOne(id);
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
