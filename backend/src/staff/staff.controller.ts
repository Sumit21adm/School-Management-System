import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Post()
    @Roles('ADMIN', 'SUPER_ADMIN')
    create(@Body() createStaffDto: CreateStaffDto) {
        return this.staffService.create(createStaffDto);
    }

    @Get()
    @Roles('ADMIN', 'SUPER_ADMIN')
    findAll(
        @Query('role') role?: UserRole,
        @Query('department') department?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.staffService.findAll(
            role,
            department,
            page ? +page : 1,
            limit ? +limit : 50
        );
    }

    @Get(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.staffService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateStaffDto: UpdateStaffDto) {
        return this.staffService.update(id, updateStaffDto);
    }

    @Delete(':id')
    @Roles('ADMIN', 'SUPER_ADMIN')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.staffService.remove(id);
    }
}
