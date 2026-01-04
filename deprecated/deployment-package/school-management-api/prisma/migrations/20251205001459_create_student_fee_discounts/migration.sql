-- CreateTable: student_fee_discounts
CREATE TABLE `student_fee_discounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` VARCHAR(20) NOT NULL,
    `feeTypeId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `discountType` ENUM('PERCENTAGE', 'FIXED') NOT NULL,
    `discountValue` DECIMAL(10, 2) NOT NULL,
    `reason` VARCHAR(200) NULL,
    `approvedBy` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `student_fee_discounts_studentId_idx`(`studentId`),
    INDEX `student_fee_discounts_feeTypeId_idx`(`feeTypeId`),
    INDEX `student_fee_discounts_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `student_fee_discounts_studentId_feeTypeId_sessionId_key`(`studentId`, `feeTypeId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_fee_discounts` ADD CONSTRAINT `student_fee_discounts_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_details`(`studentId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fee_discounts` ADD CONSTRAINT `student_fee_discounts_feeTypeId_fkey` FOREIGN KEY (`feeTypeId`) REFERENCES `fee_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fee_discounts` ADD CONSTRAINT `student_fee_discounts_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
