/*
  Warnings:

  - A unique constraint covering the columns `[aadharCardNo]` on the table `student_details` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `student_details` ADD COLUMN `aadharCardNo` VARCHAR(20) NULL,
    ADD COLUMN `fatherOccupation` VARCHAR(100) NULL,
    ADD COLUMN `motherOccupation` VARCHAR(100) NULL,
    ADD COLUMN `subjects` VARCHAR(255) NULL,
    ADD COLUMN `whatsAppNo` VARCHAR(15) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `student_details_aadharCardNo_key` ON `student_details`(`aadharCardNo`);
