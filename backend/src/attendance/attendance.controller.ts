import { Controller, Post, Body, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateModelAttendanceDto, MarkAttendanceDto, AttendanceStatus } from './dto/attendance.dto';

// Assuming we have an AuthGuard, if not we will skip for now or use a mock
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; 

@Controller('attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) { }

    @Post('mark')
    // @UseGuards(JwtAuthGuard)
    async markAttendance(@Body() dto: MarkAttendanceDto, @Request() req) {
        // Mocking user ID for now if auth not fully integrated or req.user structure unknown
        const userId = req.user?.id || 1;
        // Session ID should usually come from header or query or user context
        // converting to number casually
        const sessionId = req.headers['x-session-id'] ? parseInt(req.headers['x-session-id'] as string) : 1;

        return this.attendanceService.markAttendance(dto, userId, sessionId);
    }

    @Post('bulk')
    // @UseGuards(JwtAuthGuard)
    async bulkMarkAttendance(@Body() dto: CreateModelAttendanceDto, @Request() req) {
        const userId = req.user?.id || 1;
        return this.attendanceService.bulkMarkAttendance(dto, userId);
    }

    @Get('daily')
    async getDailyAttendance(
        @Query('date') date: string,
        @Query('sessionId') sessionId: string,
        @Query('className') className?: string,
        @Query('section') section?: string
    ) {
        return this.attendanceService.getDailyAttendance(date, parseInt(sessionId), className, section);
    }

    @Get('student/:studentId')
    async getStudentHistory(
        @Param('studentId') studentId: string,
        @Query('sessionId') sessionId: string,
        @Query('month') month?: string
    ) {
        return this.attendanceService.getStudentAttendanceHistory(
            studentId,
            parseInt(sessionId),
            month ? parseInt(month) : undefined
        );
    }

    @Get('reports/monthly')
    async getMonthlyReport(
        @Query('sessionId') sessionId: string,
        @Query('month') month: string,
        @Query('year') year: string,
        @Query('className') className?: string,
        @Query('section') section?: string
    ) {
        return this.attendanceService.getMonthlyReport(
            parseInt(sessionId),
            parseInt(month),
            parseInt(year),
            className,
            section
        );
    }

    @Get('reports/student/:studentId/summary')
    async getStudentSummary(
        @Param('studentId') studentId: string,
        @Query('sessionId') sessionId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.attendanceService.getStudentSummary(
            studentId,
            parseInt(sessionId),
            startDate,
            endDate
        );
    }

    @Get('reports/defaulters')
    async getDefaulters(
        @Query('sessionId') sessionId: string,
        @Query('threshold') threshold: string = '75',
        @Query('className') className?: string,
        @Query('section') section?: string
    ) {
        return this.attendanceService.getDefaulters(
            parseInt(sessionId),
            parseFloat(threshold),
            className,
            section
        );
    }
}
