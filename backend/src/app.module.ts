import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { AdmissionsModule } from './admissions/admissions.module';
import { FeesModule } from './fees/fees.module';

import { DashboardModule } from './dashboard/dashboard.module';
import { SessionsModule } from './sessions/sessions.module';
import { FeeTypesModule } from './fee-types/fee-types.module';
import { FeeStructureModule } from './fee-structure/fee-structure.module';
import { DiscountsModule } from './discounts/discounts.module';
import { PromotionsModule } from './promotions/promotions.module';
import { PrintSettingsModule } from './print-settings/print-settings.module';
import { ExaminationModule } from './examination/examination.module';
import { UsersModule } from './users/users.module';
import { ClassesModule } from './modules/classes/classes.module';
import { SectionsModule } from './modules/sections/sections.module';
import { RoutinesModule } from './modules/routines/routines.module';
import { StudentsModule } from './modules/students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { BackupModule } from './backup/backup.module';

import { TransportModule } from './transport/transport.module';
import { StaffModule } from './staff/staff.module';
import { RoleSettingsModule } from './role-settings/role-settings.module';
import { DataMigrationModule } from './data-migration/data-migration.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    AdmissionsModule,
    FeesModule,
    ClassesModule,
    SectionsModule,
    RoutinesModule,
    StudentsModule,

    DashboardModule,
    SessionsModule,
    FeeTypesModule,
    FeeStructureModule,
    DiscountsModule,
    PromotionsModule,
    PrintSettingsModule,
    ExaminationModule,
    UsersModule,
    StaffModule,
    SubjectsModule,
    BackupModule,
    TransportModule,
    RoleSettingsModule,
    DataMigrationModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule { }


