import { Controller, Post, Body } from '@nestjs/common';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
    constructor(private readonly studentsService: StudentsService) { }

    @Post('assign-roll-numbers')
    assignRollNumbers(
        @Body() body: { classId: number; sectionId: number; sortBy?: 'NAME' | 'ADMISSION_DATE' }
    ) {
        return this.studentsService.assignRollNumbers(body.classId, body.sectionId, body.sortBy);
    }
}
