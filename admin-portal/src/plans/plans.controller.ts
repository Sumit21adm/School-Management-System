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
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('plans')
export class PlansController {
    constructor(private readonly service: PlansService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    create(@Body() dto: CreatePlanDto) {
        return this.service.create(dto);
    }

    @Get()
    findAll(@Query('includeInactive') includeInactive?: string) {
        return this.service.findAll(includeInactive === 'true');
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePlanDto) {
        return this.service.update(id, dto);
    }

    @Patch(':id/toggle')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    toggleActive(@Param('id', ParseIntPipe) id: number) {
        return this.service.toggleActive(id);
    }
}
