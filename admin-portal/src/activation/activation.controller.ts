import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    ParseIntPipe,
} from '@nestjs/common';
import { ActivationService } from './activation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateActivationDto, ActivateCodeDto, HeartbeatDto, ValidateCodeDto, RevokeCodeDto } from './dto';

@Controller('activation')
export class ActivationController {
    constructor(private readonly activationService: ActivationService) { }

    // ============================================
    // ADMIN ENDPOINTS (Protected)
    // ============================================

    @Post('generate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async generate(@Body() dto: CreateActivationDto, @Request() req: any) {
        return this.activationService.create(dto, req.user.sub);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async findAll(
        @Query('organizationId') organizationId?: string,
        @Query('status') status?: string,
        @Query('skip') skip?: string,
        @Query('take') take?: string,
    ) {
        return this.activationService.findAll({
            organizationId: organizationId ? parseInt(organizationId) : undefined,
            status,
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
        });
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.activationService.findOne(id);
    }

    @Patch(':id/revoke')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async revoke(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RevokeCodeDto,
        @Request() req: any,
    ) {
        return this.activationService.revoke(id, req.user.sub, dto.reason);
    }

    @Get('org/:organizationId/stats')
    @UseGuards(JwtAuthGuard)
    async getOrgStats(@Param('organizationId', ParseIntPipe) organizationId: number) {
        return this.activationService.getOrgStats(organizationId);
    }

    // ============================================
    // PUBLIC ENDPOINTS (Called by School App)
    // ============================================

    @Post('validate')
    async validate(@Body() dto: ValidateCodeDto) {
        return this.activationService.validate(dto.code);
    }

    @Post('activate')
    async activate(@Body() dto: ActivateCodeDto) {
        return this.activationService.activate(dto);
    }

    @Post('heartbeat')
    async heartbeat(@Body() dto: HeartbeatDto) {
        return this.activationService.heartbeat(dto);
    }
}
