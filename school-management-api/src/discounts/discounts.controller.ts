import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto, UpdateDiscountDto } from './dto/discount.dto';

@Controller('discounts')
export class DiscountsController {
    constructor(private readonly discountsService: DiscountsService) { }

    @Get('student/:studentId')
    findByStudent(
        @Param('studentId') studentId: string,
        @Query('sessionId') sessionId?: string,
    ) {
        return this.discountsService.findByStudent(
            studentId,
            sessionId ? parseInt(sessionId) : undefined,
        );
    }

    @Post()
    create(@Body() createDiscountDto: CreateDiscountDto) {
        return this.discountsService.create(createDiscountDto);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Body() updateDiscountDto: UpdateDiscountDto,
    ) {
        return this.discountsService.update(parseInt(id), updateDiscountDto);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.discountsService.delete(parseInt(id));
    }
}
