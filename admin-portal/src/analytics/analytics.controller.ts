import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AnalyticsController {
    constructor(private readonly service: AnalyticsService) { }

    @Get('dashboard')
    getDashboard() {
        return this.service.getDashboardStats();
    }

    @Get('revenue-trend')
    getRevenueTrend(@Query('months') months?: string) {
        return this.service.getMonthlyRevenueTrend(months ? parseInt(months) : 6);
    }

    @Get('organizations')
    getOrgStats() {
        return this.service.getOrgStats();
    }

    @Get('subscriptions')
    getSubscriptionStats() {
        return this.service.getSubscriptionStats();
    }
}
