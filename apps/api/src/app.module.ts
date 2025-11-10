import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { ClassesModule } from './classes/classes.module';
import { FeeHeadsModule } from './fee-heads/fee-heads.module';
import { FeePlansModule } from './fee-plans/fee-plans.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    StudentsModule,
    ClassesModule,
    FeeHeadsModule,
    FeePlansModule,
    InvoicesModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

