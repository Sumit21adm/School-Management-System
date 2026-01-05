import { Controller, Get, Post, Body, Put, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ExamTypesService } from '../services/exam-types.service';
import { CreateExamTypeDto, UpdateExamTypeDto } from '../dto/examination.dto';

@Controller('exam-types')
export class ExamTypesController {
    constructor(private readonly examTypesService: ExamTypesService) { }

    @Get()
    findAll() {
        return this.examTypesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.examTypesService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateExamTypeDto) {
        return this.examTypesService.create(dto);
    }

    @Put(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExamTypeDto) {
        return this.examTypesService.update(id, dto);
    }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.examTypesService.delete(id);
    }
}
