import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles('ADMIN') // Admin and above can view users
    async findAll(@Query('includeInactive') includeInactive?: string, @Query('role') role?: string) {
        return this.usersService.findAll(includeInactive === 'true', role);
    }

    @Get(':id')
    @Roles('ADMIN')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.findOne(id);
    }

    @Post()
    @Roles('SUPER_ADMIN') // Only Super Admin can create users
    async create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Put(':id')
    @Roles('SUPER_ADMIN') // Only Super Admin can update users
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.update(id, updateUserDto);
    }

    @Put(':id/password')
    @Roles('SUPER_ADMIN') // Only Super Admin can reset passwords
    async changePassword(
        @Param('id', ParseIntPipe) id: number,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        return this.usersService.changePassword(id, changePasswordDto);
    }

    @Delete(':id')
    @Roles('SUPER_ADMIN') // Only Super Admin can delete users
    async delete(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.delete(id);
    }
}
