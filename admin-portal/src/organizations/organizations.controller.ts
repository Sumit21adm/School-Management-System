import {
    Controller,
    Get,
    Post,
    Put,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationsController {
    constructor(private readonly service: OrganizationsService) { }

    @Post()
    @Roles('SUPER_ADMIN')
    create(@Body() dto: CreateOrganizationDto) {
        return this.service.create(dto);
    }

    @Get()
    @Roles('SUPER_ADMIN')
    findAll(
        @Query('skip') skip?: string,
        @Query('take') take?: string,
        @Query('status') status?: string,
        @Query('search') search?: string,
    ) {
        return this.service.findAll({
            skip: skip ? parseInt(skip) : undefined,
            take: take ? parseInt(take) : undefined,
            status,
            search,
        });
    }

    @Get('stats')
    @Roles('SUPER_ADMIN')
    getStats() {
        return this.service.getDashboardStats();
    }

    @Get(':id')
    @Roles('SUPER_ADMIN')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Get('slug/:slug')
    findBySlug(@Param('slug') slug: string) {
        return this.service.findBySlug(slug);
    }

    @Put(':id')
    @Roles('SUPER_ADMIN')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateOrganizationDto,
    ) {
        return this.service.update(id, dto);
    }

    @Patch(':id/status')
    @Roles('SUPER_ADMIN')
    updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body('status') status: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED',
    ) {
        return this.service.updateStatus(id, status);
    }
}
