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
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
    constructor(private readonly service: InvoicesService) { }

    @Post('generate/:subscriptionId')
    @Roles('SUPER_ADMIN')
    generate(@Param('subscriptionId', ParseIntPipe) subscriptionId: number) {
        return this.service.generateInvoice(subscriptionId);
    }

    @Get()
    @Roles('SUPER_ADMIN')
    findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('status') status?: string,
        @Query('organizationId') organizationId?: string,
    ) {
        return this.service.findAll({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            status,
            organizationId: organizationId ? parseInt(organizationId) : undefined,
        });
    }

    @Get('overdue')
    @Roles('SUPER_ADMIN')
    getOverdue() {
        return this.service.getOverdueInvoices();
    }

    @Get('revenue-stats')
    @Roles('SUPER_ADMIN')
    getRevenueStats() {
        return this.service.getRevenueStats();
    }

    @Get(':id')
    @Roles('SUPER_ADMIN', 'ORG_ADMIN')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Patch(':id/mark-paid')
    @Roles('SUPER_ADMIN')
    markAsPaid(
        @Param('id', ParseIntPipe) id: number,
        @Body() paymentDetails: {
            gateway: string;
            paymentId: string;
            paymentOrderId?: string;
            paymentMethod?: string;
        },
    ) {
        return this.service.markAsPaid(id, paymentDetails);
    }
}
