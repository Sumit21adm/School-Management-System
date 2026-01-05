/*
  Warnings:

  - The column `sex` on the `student_details` table is being renamed to `gender`.

*/
-- AlterTable
ALTER TABLE `student_details` RENAME COLUMN `sex` TO `gender`;
