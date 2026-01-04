/*
  Warnings:

  - You are about to drop the `exam_creator` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `exam_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transport` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transport_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `exam_results` DROP FOREIGN KEY `exam_results_examId_fkey`;

-- DropForeignKey
ALTER TABLE `exam_results` DROP FOREIGN KEY `exam_results_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `transport_assignments` DROP FOREIGN KEY `transport_assignments_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `transport_assignments` DROP FOREIGN KEY `transport_assignments_transportId_fkey`;

-- DropTable
DROP TABLE `exam_creator`;

-- DropTable
DROP TABLE `exam_results`;

-- DropTable
DROP TABLE `transport`;

-- DropTable
DROP TABLE `transport_assignments`;
