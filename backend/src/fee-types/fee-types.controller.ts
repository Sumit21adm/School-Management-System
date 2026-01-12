import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { FeeTypesService } from './fee-types.service';
import { CreateFeeTypeDto, UpdateFeeTypeDto } from './dto/fee-type.dto';

@Controller('fee-types')
export class FeeTypesController {
    constructor(private readonly feeTypesService: FeeTypesService) { }

    @Get()
    findAll(@Query('activeOnly') activeOnly?: string) {
        const active = activeOnly === 'false' ? false : true;
        return this.feeTypesService.findAll(active);
    }

    @Get('by-structure')
    getByStructure(
        @Query('sessionId', ParseIntPipe) sessionId: number,
        @Query('className') className?: string,
    ) {
        return this.feeTypesService.getByStructure(sessionId, className);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.feeTypesService.findOne(id);
    }

    @Post()
    create(@Body() createFeeTypeDto: CreateFeeTypeDto) {
        return this.feeTypesService.create(createFeeTypeDto);
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateFeeTypeDto: UpdateFeeTypeDto,
    ) {
        return this.feeTypesService.update(id, updateFeeTypeDto);
    }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.feeTypesService.delete(id);
    }
}
