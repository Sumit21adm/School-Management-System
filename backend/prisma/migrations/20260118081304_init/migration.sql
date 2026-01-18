-- CreateTable
CREATE TABLE `school_classes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(20) NOT NULL,
    `displayName` VARCHAR(50) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `capacity` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `school_classes_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `rollNumber` VARCHAR(10) NULL,
    `admissionDate` DATE NOT NULL,
    `address` TEXT NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `email` VARCHAR(100) NULL,
    `photoUrl` VARCHAR(255) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `aadharCardNo` VARCHAR(20) NULL,
    `fatherOccupation` VARCHAR(100) NULL,
    `motherOccupation` VARCHAR(100) NULL,
    `subjects` VARCHAR(255) NULL,
    `whatsAppNo` VARCHAR(15) NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'NA',
    `religion` VARCHAR(50) NULL,
    `apaarId` VARCHAR(20) NULL,
    `fatherAadharNo` VARCHAR(12) NULL,
    `fatherPanNo` VARCHAR(10) NULL,
    `motherAadharNo` VARCHAR(12) NULL,
    `motherPanNo` VARCHAR(10) NULL,
    `guardianRelation` VARCHAR(20) NULL,
    `guardianName` VARCHAR(100) NULL,
    `guardianOccupation` VARCHAR(100) NULL,
    `guardianPhone` VARCHAR(15) NULL,
    `guardianEmail` VARCHAR(100) NULL,
    `guardianAadharNo` VARCHAR(12) NULL,
    `guardianPanNo` VARCHAR(10) NULL,
    `guardianAddress` TEXT NULL,
    `sessionId` INTEGER NULL,

    UNIQUE INDEX `student_details_studentId_key`(`studentId`),
    UNIQUE INDEX `student_details_aadharCardNo_key`(`aadharCardNo`),
    INDEX `student_details_className_idx`(`className`),
    INDEX `student_details_section_idx`(`section`),
    INDEX `student_details_status_idx`(`status`),
    INDEX `student_details_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feetransaction_new` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` VARCHAR(50) NOT NULL,
    `studentId` VARCHAR(20) NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `receiptNo` VARCHAR(50) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(100) NOT NULL,
    `date` DATE NOT NULL,
    `yearId` INTEGER NOT NULL,
    `remarks` TEXT NULL,
    `collectedBy` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `feetransaction_new_transactionId_key`(`transactionId`),
    UNIQUE INDEX `feetransaction_new_receiptNo_key`(`receiptNo`),
    INDEX `feetransaction_new_studentId_idx`(`studentId`),
    INDEX `feetransaction_new_sessionId_idx`(`sessionId`),
    INDEX `feetransaction_new_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
CREATE TABLE `payment_mode_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `paymentMode` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `reference` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payment_mode_details_transactionId_idx`(`transactionId`),
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
    `advanceUsed` DECIMAL(10, 2) NOT NULL DEFAULT 0,
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
    `discountAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `description` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `demand_bill_items_billId_idx`(`billId`),
    INDEX `demand_bill_items_feeTypeId_idx`(`feeTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(30) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isSetupMode` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `academic_sessions_name_key`(`name`),
    INDEX `academic_sessions_isActive_idx`(`isActive`),
    INDEX `academic_sessions_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(200) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isRecurring` BOOLEAN NOT NULL DEFAULT false,
    `frequency` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fee_types_name_key`(`name`),
    INDEX `fee_types_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_structures` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `className` VARCHAR(20) NOT NULL,
    `description` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fee_structures_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `fee_structures_sessionId_className_key`(`sessionId`, `className`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_structure_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `structureId` INTEGER NOT NULL,
    `feeTypeId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `isOptional` BOOLEAN NOT NULL DEFAULT false,
    `frequency` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fee_structure_items_structureId_idx`(`structureId`),
    INDEX `fee_structure_items_feeTypeId_idx`(`feeTypeId`),
    UNIQUE INDEX `fee_structure_items_structureId_feeTypeId_key`(`structureId`, `feeTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
CREATE TABLE `role_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` VARCHAR(50) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `displayName` VARCHAR(100) NOT NULL,
    `description` VARCHAR(200) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `role_settings_role_key`(`role`),
    INDEX `role_settings_isEnabled_idx`(`isEnabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'PRINCIPAL', 'VICE_PRINCIPAL', 'ADMIN', 'HEAD_OF_DEPARTMENT', 'COORDINATOR', 'SECTION_INCHARGE', 'TEACHER', 'ACCOUNTANT', 'RECEPTIONIST', 'LIBRARIAN', 'LAB_ASSISTANT', 'OFFICE_STAFF', 'CLERK', 'DRIVER', 'CONDUCTOR', 'SECURITY', 'PEON', 'PARENT', 'STUDENT') NOT NULL DEFAULT 'RECEPTIONIST',
    `permissions` TEXT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NULL,
    `phone` VARCHAR(15) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastLogin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `designation` VARCHAR(100) NOT NULL,
    `department` VARCHAR(50) NULL,
    `joiningDate` DATE NOT NULL,
    `bloodGroup` VARCHAR(5) NULL,
    `qualification` VARCHAR(200) NULL,
    `experience` VARCHAR(100) NULL,
    `basicSalary` DECIMAL(10, 2) NULL,
    `bankName` VARCHAR(100) NULL,
    `accountNo` VARCHAR(30) NULL,
    `ifscCode` VARCHAR(20) NULL,
    `panNo` VARCHAR(15) NULL,
    `aadharNo` VARCHAR(16) NULL,

    UNIQUE INDEX `staff_details_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `driver_details` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `licenseNumber` VARCHAR(50) NULL,
    `licenseExpiry` DATE NULL,
    `badgeNumber` VARCHAR(50) NULL,

    UNIQUE INDEX `driver_details_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff_attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'HALFDAY', 'LEAVE') NOT NULL,
    `checkIn` VARCHAR(10) NULL,
    `checkOut` VARCHAR(10) NULL,
    `remarks` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `staff_attendance_date_idx`(`date`),
    UNIQUE INDEX `staff_attendance_userId_date_key`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_academic_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` VARCHAR(20) NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `className` VARCHAR(20) NOT NULL,
    `section` VARCHAR(5) NOT NULL,
    `rollNo` VARCHAR(20) NULL,
    `status` VARCHAR(20) NOT NULL,
    `finalResult` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_academic_history_studentId_idx`(`studentId`),
    INDEX `student_academic_history_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `student_academic_history_studentId_sessionId_key`(`studentId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `print_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `schoolName` VARCHAR(200) NOT NULL,
    `schoolAddress` TEXT NOT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `website` VARCHAR(100) NULL,
    `logoUrl` VARCHAR(255) NULL,
    `tagline` VARCHAR(200) NULL,
    `affiliationNo` VARCHAR(50) NULL,
    `affiliationNote` TEXT NULL,
    `isoCertifiedNote` VARCHAR(255) NULL,
    `demandBillNote` TEXT NULL,
    `feeReceiptNote` TEXT NULL,
    `admitCardNote` TEXT NULL,
    `transferCertNote` TEXT NULL,
    `idCardNote` TEXT NULL,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(200) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_types_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(20) NULL,
    `description` TEXT NULL,
    `color` VARCHAR(7) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subjects_name_key`(`name`),
    UNIQUE INDEX `subjects_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `isCompulsory` BOOLEAN NOT NULL DEFAULT true,
    `weeklyPeriods` INTEGER NOT NULL DEFAULT 0,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `class_subjects_classId_subjectId_key`(`classId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exams` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `examTypeId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exams_examTypeId_idx`(`examTypeId`),
    INDEX `exams_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `examId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `className` VARCHAR(20) NOT NULL,
    `date` DATE NOT NULL,
    `startTime` TIME NOT NULL,
    `endTime` TIME NOT NULL,
    `roomNo` VARCHAR(20) NULL,
    `period` INTEGER NULL,

    INDEX `exam_schedules_examId_idx`(`examId`),
    INDEX `exam_schedules_subjectId_idx`(`subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(10) NOT NULL,
    `classId` INTEGER NOT NULL,
    `roomNo` VARCHAR(20) NULL,
    `capacity` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sections_classId_name_key`(`classId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `qualification` VARCHAR(200) NULL,
    `experience` VARCHAR(100) NULL,
    `specialization` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teacher_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_teacher_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectionId` INTEGER NOT NULL,
    `teacherId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `class_teacher_assignments_sectionId_sessionId_isPrimary_key`(`sectionId`, `sessionId`, `isPrimary`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subject_teacher_allocations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectionId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `teacherId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,

    UNIQUE INDEX `subject_teacher_allocations_sectionId_subjectId_sessionId_key`(`sectionId`, `subjectId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_routines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sectionId` INTEGER NOT NULL,
    `sessionId` INTEGER NOT NULL,
    `dayOfWeek` VARCHAR(10) NOT NULL,
    `periodNo` INTEGER NOT NULL,
    `subjectId` INTEGER NULL,
    `teacherId` INTEGER NULL,
    `startTime` VARCHAR(10) NULL,
    `endTime` VARCHAR(10) NULL,

    UNIQUE INDEX `class_routines_sectionId_sessionId_dayOfWeek_periodNo_key`(`sectionId`, `sessionId`, `dayOfWeek`, `periodNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicleNo` VARCHAR(20) NOT NULL,
    `vehicleType` VARCHAR(50) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `make` VARCHAR(50) NULL,
    `model` VARCHAR(50) NULL,
    `year` INTEGER NULL,
    `insuranceNo` VARCHAR(50) NULL,
    `insuranceExpiry` DATE NULL,
    `fitnessExpiry` DATE NULL,
    `permitExpiry` DATE NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `driverId` INTEGER NULL,

    UNIQUE INDEX `vehicles_vehicleNo_key`(`vehicleNo`),
    INDEX `vehicles_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `routeName` VARCHAR(100) NOT NULL,
    `routeCode` VARCHAR(20) NOT NULL,
    `startPoint` VARCHAR(100) NOT NULL,
    `endPoint` VARCHAR(100) NOT NULL,
    `viaPoints` VARCHAR(200) NULL,
    `distance` DECIMAL(5, 2) NULL,
    `estimatedTime` INTEGER NULL,
    `morningDeparture` VARCHAR(10) NULL,
    `eveningDeparture` VARCHAR(10) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `vehicleId` INTEGER NULL,

    UNIQUE INDEX `routes_routeCode_key`(`routeCode`),
    INDEX `routes_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `route_stops` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `stopName` VARCHAR(100) NOT NULL,
    `stopOrder` INTEGER NOT NULL,
    `pickupTime` VARCHAR(10) NULL,
    `dropTime` VARCHAR(10) NULL,
    `landmark` VARCHAR(200) NULL,
    `latitude` DECIMAL(10, 8) NULL,
    `longitude` DECIMAL(11, 8) NULL,
    `distanceFromSchool` DECIMAL(5, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `routeId` INTEGER NOT NULL,

    INDEX `route_stops_routeId_idx`(`routeId`),
    UNIQUE INDEX `route_stops_routeId_stopOrder_key`(`routeId`, `stopOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_transports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transportType` VARCHAR(20) NOT NULL DEFAULT 'both',
    `startDate` DATE NOT NULL,
    `endDate` DATE NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `studentId` VARCHAR(20) NOT NULL,
    `routeId` INTEGER NOT NULL,
    `pickupStopId` INTEGER NULL,
    `dropStopId` INTEGER NULL,

    UNIQUE INDEX `student_transports_studentId_key`(`studentId`),
    INDEX `student_transports_routeId_idx`(`routeId`),
    INDEX `student_transports_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transport_fare_slabs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `minDistance` DECIMAL(5, 2) NOT NULL,
    `maxDistance` DECIMAL(5, 2) NOT NULL,
    `monthlyFee` DECIMAL(10, 2) NOT NULL,
    `description` VARCHAR(100) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `transport_fare_slabs_minDistance_maxDistance_idx`(`minDistance`, `maxDistance`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_details` ADD CONSTRAINT `student_details_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feetransaction_new` ADD CONSTRAINT `feetransaction_new_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_details`(`studentId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `feetransaction_new` ADD CONSTRAINT `feetransaction_new_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_payment_details` ADD CONSTRAINT `fee_payment_details_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `feetransaction_new`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_payment_details` ADD CONSTRAINT `fee_payment_details_feeTypeId_fkey` FOREIGN KEY (`feeTypeId`) REFERENCES `fee_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_mode_details` ADD CONSTRAINT `payment_mode_details_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `feetransaction_new`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demand_bills` ADD CONSTRAINT `demand_bills_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_details`(`studentId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demand_bills` ADD CONSTRAINT `demand_bills_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demand_bill_items` ADD CONSTRAINT `demand_bill_items_billId_fkey` FOREIGN KEY (`billId`) REFERENCES `demand_bills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demand_bill_items` ADD CONSTRAINT `demand_bill_items_feeTypeId_fkey` FOREIGN KEY (`feeTypeId`) REFERENCES `fee_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structure_items` ADD CONSTRAINT `fee_structure_items_structureId_fkey` FOREIGN KEY (`structureId`) REFERENCES `fee_structures`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structure_items` ADD CONSTRAINT `fee_structure_items_feeTypeId_fkey` FOREIGN KEY (`feeTypeId`) REFERENCES `fee_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fee_discounts` ADD CONSTRAINT `student_fee_discounts_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_details`(`studentId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fee_discounts` ADD CONSTRAINT `student_fee_discounts_feeTypeId_fkey` FOREIGN KEY (`feeTypeId`) REFERENCES `fee_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_fee_discounts` ADD CONSTRAINT `student_fee_discounts_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_details` ADD CONSTRAINT `staff_details_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_details` ADD CONSTRAINT `driver_details_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff_attendance` ADD CONSTRAINT `staff_attendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_academic_history` ADD CONSTRAINT `student_academic_history_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_details`(`studentId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_academic_history` ADD CONSTRAINT `student_academic_history_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_subjects` ADD CONSTRAINT `class_subjects_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `school_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_subjects` ADD CONSTRAINT `class_subjects_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_examTypeId_fkey` FOREIGN KEY (`examTypeId`) REFERENCES `exam_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_schedules` ADD CONSTRAINT `exam_schedules_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sections` ADD CONSTRAINT `sections_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `school_classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_profiles` ADD CONSTRAINT `teacher_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_teacher_assignments` ADD CONSTRAINT `class_teacher_assignments_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_teacher_assignments` ADD CONSTRAINT `class_teacher_assignments_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_teacher_assignments` ADD CONSTRAINT `class_teacher_assignments_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_teacher_allocations` ADD CONSTRAINT `subject_teacher_allocations_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_teacher_allocations` ADD CONSTRAINT `subject_teacher_allocations_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_teacher_allocations` ADD CONSTRAINT `subject_teacher_allocations_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subject_teacher_allocations` ADD CONSTRAINT `subject_teacher_allocations_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_routines` ADD CONSTRAINT `class_routines_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_routines` ADD CONSTRAINT `class_routines_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_routines` ADD CONSTRAINT `class_routines_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_routines` ADD CONSTRAINT `class_routines_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `routes` ADD CONSTRAINT `routes_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `route_stops` ADD CONSTRAINT `route_stops_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_transports` ADD CONSTRAINT `student_transports_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `student_details`(`studentId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_transports` ADD CONSTRAINT `student_transports_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_transports` ADD CONSTRAINT `student_transports_pickupStopId_fkey` FOREIGN KEY (`pickupStopId`) REFERENCES `route_stops`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_transports` ADD CONSTRAINT `student_transports_dropStopId_fkey` FOREIGN KEY (`dropStopId`) REFERENCES `route_stops`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
