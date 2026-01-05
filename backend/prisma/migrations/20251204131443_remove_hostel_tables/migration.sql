/*
  Warnings:

  - You are about to drop the `hostel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `hostel_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `hostel_assignments` DROP FOREIGN KEY `hostel_assignments_hostelId_fkey`;

-- DropForeignKey
ALTER TABLE `hostel_assignments` DROP FOREIGN KEY `hostel_assignments_studentId_fkey`;

-- DropTable
DROP TABLE `hostel`;

-- DropTable
DROP TABLE `hostel_assignments`;
