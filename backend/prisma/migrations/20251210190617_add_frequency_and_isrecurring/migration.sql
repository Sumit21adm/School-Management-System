-- AlterTable
ALTER TABLE `fee_types` ADD COLUMN `frequency` VARCHAR(20) NULL,
    ADD COLUMN `isRecurring` BOOLEAN NOT NULL DEFAULT false;
