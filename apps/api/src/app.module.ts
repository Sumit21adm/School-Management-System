import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { ClassesModule } from './classes/classes.module';
import { GuardiansModule } from './guardians/guardians.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ExamsModule } from './exams/exams.module';
import { GradesModule } from './grades/grades.module';
import { ReportCardsModule } from './report-cards/report-cards.module';
import { PromotionsModule } from './promotions/promotions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    StudentsModule,
    ClassesModule,
    GuardiansModule,
    AttendanceModule,
    AnnouncementsModule,
    ExamsModule,
    GradesModule,
    ReportCardsModule,
    PromotionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

