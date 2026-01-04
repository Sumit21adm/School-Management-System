/*
  Warnings:

  - Added the required column `sessionId` to the `feetransaction_new` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `feetransaction_new` ADD COLUMN `collectedBy` VARCHAR(100) NULL,
    ADD COLUMN `remarks` TEXT NULL,
    ADD COLUMN `sessionId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `fee_payment_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `feeTypeId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `netAmount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fee_payment_details_transactionId_idx`(`transactionId`),
    INDEX `fee_payment_details_feeTypeId_idx`(`feeTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demand_bills` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `billNo` VARCHAR(50) NOT NULL,
    `studentId` VARCHAR(20) NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `billDate` DATE NOT NULL,
    `dueDate` DATE NOT NULL,
    `totalAmount` DECIMAL(10, 2) NOT NULL,
    `previousDues` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `lateFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `netAmount` DECIMAL(10, 2) NOT NULL,
    `paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `sentDate` DATETIME(3) NULL,
    `paidDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `demand_bills_billNo_key`(`billNo`),
    INDEX `demand_bills_studentId_idx`(`studentId`),
    INDEX `demand_bills_sessionId_idx`(`sessionId`),
    INDEX `demand_bills_status_idx`(`status`),
    INDEX `demand_bills_billDate_idx`(`billDate`),
    UNIQUE INDEX `demand_bills_studentId_sessionId_month_year_key`(`studentId`, `sessionId`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demand_bill_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `billId` INTEGER NOT NULL,
    `feeTypeId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `demand_bill_items_billId_idx`(`billId`),
    INDEX `demand_bill_items_feeTypeId_idx`(`feeTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `feetransaction_new_sessionId_idx` ON `feetransaction_new`(`sessionId`);

-- AddForeignKey
ALTER TABLE `feetransaction_new` ADD CONSTRAINT `feetransaction_new_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_payment_details` ADD CONSTRAINT `fee_payment_details_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `feetransaction_new`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_payment_details` ADD CONSTRAINT `fee_payment_details_feeTypeId_fkey` FOREIGN KEY (`feeTypeId`) REFERENCES `fee_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demand_bills` ADD CONSTRAINT `demand_bills_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_details`(`studentId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demand_bills` ADD CONSTRAINT `demand_bills_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demand_bill_items` ADD CONSTRAINT `demand_bill_items_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `demand_bills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demand_bill_items` ADD CONSTRAINT `demand_bill_items_feeTypeId_fkey` FOREIGN KEY (`feeTypeId`) REFERENCES `fee_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
