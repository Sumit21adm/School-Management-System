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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    AdmissionsModule,
    FeesModule,

    DashboardModule,
    SessionsModule,
    FeeTypesModule,
    FeeStructureModule,
    DiscountsModule,
    PromotionsModule,
    PrintSettingsModule,
    ExaminationModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
  exports: [PrismaService],
})
export class AppModule { }


