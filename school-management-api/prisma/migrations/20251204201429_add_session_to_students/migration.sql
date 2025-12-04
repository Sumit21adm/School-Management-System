-- AlterTable
ALTER TABLE `student_details` ADD COLUMN `sessionId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `student_details_className_idx` ON `student_details`(`className`);

-- CreateIndex
CREATE INDEX `student_details_section_idx` ON `student_details`(`section`);

-- CreateIndex
CREATE INDEX `student_details_status_idx` ON `student_details`(`status`);

-- CreateIndex
CREATE INDEX `student_details_sessionId_idx` ON `student_details`(`sessionId`);

-- AddForeignKey
ALTER TABLE `student_details` ADD CONSTRAINT `student_details_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
