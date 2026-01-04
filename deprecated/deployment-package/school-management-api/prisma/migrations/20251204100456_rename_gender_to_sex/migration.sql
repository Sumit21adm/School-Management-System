/*
  Warnings:

  - The column `gender` on the `student_details` table is being renamed to `sex`.

*/
-- AlterTable
ALTER TABLE `student_details` RENAME COLUMN `gender` TO `sex`;
