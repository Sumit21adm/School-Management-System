-- CreateTable: fee_types
CREATE TABLE `fee_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(200) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `fee_types_name_key`(`name`),
    INDEX `fee_types_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: fee_structures
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

-- CreateTable: fee_structure_items
CREATE TABLE `fee_structure_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `structureId` INTEGER NOT NULL,
    `feeTypeId` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `isOptional` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `fee_structure_items_structureId_idx`(`structureId`),
    INDEX `fee_structure_items_feeTypeId_idx`(`feeTypeId`),
    UNIQUE INDEX `fee_structure_items_structureId_feeTypeId_key`(`structureId`, `feeTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `academic_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structure_items` ADD CONSTRAINT `fee_structure_items_structureId_fkey` FOREIGN KEY (`structureId`) REFERENCES `fee_structures`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structure_items` ADD CONSTRAINT `fee_structure_items_feeTypeId_fkey` FOREIGN KEY (`feeTypeId`) REFERENCES `fee_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default fee types
INSERT INTO `fee_types` (`name`, `description`, `isActive`, `isDefault`, `updatedAt`)
VALUES 
  ('Tuition Fee', 'Main tuition fee', true, true, NOW()),
  ('Computer Fee', 'Computer lab and IT infrastructure', true, true, NOW()),
  ('Activity Fee', 'Extra-curricular activities', true, true, NOW()),
  ('Exam Fee', 'Examination and assessment', true, true, NOW()),
  ('Library Fee', 'Library access and maintenance', true, true, NOW()),
  ('Sports Fee', 'Sports facilities and equipment', true, true, NOW()),
  ('Miscellaneous Fee', 'Other charges', true, true, NOW());
