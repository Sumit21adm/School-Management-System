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

-- Insert default session
INSERT INTO `academic_sessions` (`name`, `startDate`, `endDate`, `isActive`, `isSetupMode`, `updatedAt`)
VALUES ('APR 2024-MAR 2025', '2024-04-01', '2025-03-31', true, false, NOW());
