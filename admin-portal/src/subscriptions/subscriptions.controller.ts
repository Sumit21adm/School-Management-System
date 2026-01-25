import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
    constructor(private readonly service: SubscriptionsService) { }

    @Post()
    @Roles('SUPER_ADMIN')
    create(@Body() dto: CreateSubscriptionDto) {
        return this.service.create(dto);
    }

    @Get()
    @Roles('SUPER_ADMIN')
    findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('status') status?: string,
    ) {
        return this.service.findAll({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            status,
        });
    }

    @Get('expiring-trials')
    @Roles('SUPER_ADMIN')
    getExpiringTrials(@Query('days') days?: string) {
        return this.service.getExpiringTrials(days ? parseInt(days) : 7);
    }

    @Get(':id')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Patch(':id/change-plan')
    @Roles('SUPER_ADMIN')
    changePlan(
        @Param('id', ParseIntPipe) id: number,
        @Body('planId', ParseIntPipe) planId: number,
    ) {
        return this.service.changePlan(id, planId);
    }

    @Patch(':id/cancel')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    cancel(
        @Param('id', ParseIntPipe) id: number,
        @Body('reason') reason?: string,
    ) {
        return this.service.cancel(id, reason);
    }

    @Patch(':id/activate')
    @Roles('SUPER_ADMIN')
    activate(@Param('id', ParseIntPipe) id: number) {
        return this.service.activate(id);
    }

    @Post(':id/addons')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    addAddon(
        @Param('id', ParseIntPipe) id: number,
        @Body('addonId', ParseIntPipe) addonId: number,
    ) {
        return this.service.addAddon(id, addonId);
    }
}
