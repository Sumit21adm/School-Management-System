-- CreateTable
CREATE TABLE `student_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `fatherName` VARCHAR(100) NOT NULL,
    `motherName` VARCHAR(100) NOT NULL,
    `dob` DATE NOT NULL,
    `gender` VARCHAR(10) NOT NULL,
    `className` VARCHAR(20) NOT NULL,
    `section` VARCHAR(5) NOT NULL,
    `admissionDate` DATE NOT NULL,
    `address` TEXT NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `email` VARCHAR(100) NULL,
    `photoUrl` VARCHAR(255) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_details_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feetransaction_new` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` VARCHAR(50) NOT NULL,
    `studentId` VARCHAR(20) NOT NULL,
    `receiptNo` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(100) NOT NULL,
    `paymentMode` VARCHAR(20) NOT NULL,
    `date` DATE NOT NULL,
    `yearId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `feetransaction_new_transactionId_key`(`transactionId`),
    UNIQUE INDEX `feetransaction_new_receiptNo_key`(`receiptNo`),
    INDEX `feetransaction_new_studentId_idx`(`studentId`),
    INDEX `feetransaction_new_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_creator` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `examName` VARCHAR(100) NOT NULL,
    `className` VARCHAR(20) NOT NULL,
    `examDate` DATE NOT NULL,
    `totalMarks` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_results` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` VARCHAR(20) NOT NULL,
    `examId` INTEGER NOT NULL,
    `subject` VARCHAR(50) NOT NULL,
    `marksObtained` INTEGER NOT NULL,
    `totalMarks` INTEGER NOT NULL,
    `grade` VARCHAR(5) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_results_studentId_idx`(`studentId`),
    INDEX `exam_results_examId_idx`(`examId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicleNo` VARCHAR(20) NOT NULL,
    `routeName` VARCHAR(100) NOT NULL,
    `driverName` VARCHAR(100) NOT NULL,
    `driverPhone` VARCHAR(15) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `transport_vehicleNo_key`(`vehicleNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` VARCHAR(20) NOT NULL,
    `transportId` INTEGER NOT NULL,
    `pickupPoint` VARCHAR(200) NULL,
    `fee` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `transport_assignments_studentId_idx`(`studentId`),
    INDEX `transport_assignments_transportId_idx`(`transportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomNo` VARCHAR(10) NOT NULL,
    `hostelType` VARCHAR(20) NOT NULL,
    `floor` INTEGER NOT NULL,
    `capacity` INTEGER NOT NULL,
    `occupied` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `hostel_roomNo_key`(`roomNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hostel_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` VARCHAR(20) NOT NULL,
    `hostelId` INTEGER NOT NULL,
    `bedNo` INTEGER NULL,
    `fee` DECIMAL(10, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `hostel_assignments_studentId_idx`(`studentId`),
    INDEX `hostel_assignments_hostelId_idx`(`hostelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemCode` VARCHAR(20) NOT NULL,
    `itemName` VARCHAR(200) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `inventory_itemCode_key`(`itemCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_movements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemId` INTEGER NOT NULL,
    `movementType` VARCHAR(20) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `feetransaction_new` ADD CONSTRAINT `feetransaction_new_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_details`(`studentId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_details`(`studentId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exam_creator`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_assignments` ADD CONSTRAINT `transport_assignments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_details`(`studentId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transport_assignments` ADD CONSTRAINT `transport_assignments_transportId_fkey` FOREIGN KEY (`transportId`) REFERENCES `transport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_assignments` ADD CONSTRAINT `hostel_assignments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_details`(`studentId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hostel_assignments` ADD CONSTRAINT `hostel_assignments_hostelId_fkey` FOREIGN KEY (`hostelId`) REFERENCES `hostel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
