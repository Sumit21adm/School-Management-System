import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { CloudStorageService } from './cloud-storage.service';
import { PrismaService } from '../prisma.service';

@Module({
    controllers: [BackupController],
    providers: [BackupService, CloudStorageService, PrismaService],
})
export class BackupModule { }
