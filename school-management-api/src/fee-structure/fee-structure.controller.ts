import { Controller, Get, Put, Post, Param, Body, ParseIntPipe, Header } from '@nestjs/common';
import { FeeStructureService } from './fee-structure.service';
import { UpsertFeeStructureDto, CopyFeeStructureDto } from './dto/fee-structure.dto';

@Controller('fee-structure')
export class FeeStructureController {
    constructor(private readonly feeStructureService: FeeStructureService) { }

    @Get(':sessionId/:className')
    @Header('Cache-Control', 'no-store')
    getStructure(
        @Param('sessionId', ParseIntPipe) sessionId: number,
        @Param('className') className: string,
    ) {
        return this.feeStructureService.getStructure(sessionId, className);
    }

    @Put(':sessionId/:className')
    upsertStructure(
        @Param('sessionId', ParseIntPipe) sessionId: number,
        @Param('className') className: string,
        @Body() dto: UpsertFeeStructureDto,
    ) {
        return this.feeStructureService.upsertStructure(sessionId, className, dto);
    }

    @Post('copy')
    copyStructure(@Body() dto: CopyFeeStructureDto) {
        return this.feeStructureService.copyStructure(dto);
    }
}
