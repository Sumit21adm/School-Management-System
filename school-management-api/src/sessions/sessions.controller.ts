import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';

@Controller('sessions')
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    @Get()
    findAll(@Query('includeInactive') includeInactive?: string) {
        const include = includeInactive === 'false' ? false : true;
        return this.sessionsService.findAll(include);
    }

    @Get('active')
    findActive() {
        return this.sessionsService.findActive();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.sessionsService.findOne(id);
    }

    @Post()
    create(@Body() createSessionDto: CreateSessionDto) {
        return this.sessionsService.create(createSessionDto);
    }

    @Put(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateSessionDto: UpdateSessionDto,
    ) {
        return this.sessionsService.update(id, updateSessionDto);
    }

    @Post(':id/activate')
    activate(@Param('id', ParseIntPipe) id: number) {
        return this.sessionsService.activate(id);
    }

    @Delete(':id')
    delete(@Param('id', ParseIntPipe) id: number) {
        return this.sessionsService.delete(id);
    }
}
