import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { ClassesModule } from './classes/classes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    StudentsModule,
    ClassesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

