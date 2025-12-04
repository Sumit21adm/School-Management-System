import { Controller, Get, Post, Body, Query, ParseIntPipe } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromoteStudentsDto } from './dto/promote-students.dto';

@Controller('promotions')
export class PromotionsController {
    constructor(private readonly promotionsService: PromotionsService) { }

    @Get('preview')
    async previewPromotion(
        @Query('currentSessionId', ParseIntPipe) currentSessionId: number,
        @Query('className') className: string,
        @Query('section') section: string,
    ) {
        return this.promotionsService.previewPromotion({
            currentSessionId,
            className,
            section,
        });
    }

    @Post('execute')
    async executePromotion(@Body() promoteStudentsDto: PromoteStudentsDto) {
        return this.promotionsService.executePromotion(promoteStudentsDto);
    }
}
