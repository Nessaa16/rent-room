/*
  Warnings:

  - A unique constraint covering the columns `[kode]` on the table `Peralatan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kode` to the `Peralatan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `peralatan` ADD COLUMN `kode` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Peralatan_kode_key` ON `Peralatan`(`kode`);
