/*
  Warnings:

  - You are about to drop the column `peralatanId` on the `peminjaman` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalKembali` on the `peminjaman` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalKembaliAktual` on the `peminjaman` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalPinjam` on the `peminjaman` table. All the data in the column will be lost.
  - You are about to drop the column `tipe` on the `peralatan` table. All the data in the column will be lost.
  - You are about to drop the column `lokasi` on the `ruang` table. All the data in the column will be lost.
  - Added the required column `tanggalPakai` to the `Peminjaman` table without a default value. This is not possible if the table is not empty.
  - Made the column `durasiJam` on table `peminjaman` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `peminjaman` DROP FOREIGN KEY `Peminjaman_peralatanId_fkey`;

-- AlterTable
ALTER TABLE `peminjaman` DROP COLUMN `peralatanId`,
    DROP COLUMN `tanggalKembali`,
    DROP COLUMN `tanggalKembaliAktual`,
    DROP COLUMN `tanggalPinjam`,
    ADD COLUMN `tanggalPakai` DATETIME(3) NOT NULL,
    MODIFY `durasiJam` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `peralatan` DROP COLUMN `tipe`,
    ADD COLUMN `kategori` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ruang` DROP COLUMN `lokasi`,
    ADD COLUMN `gedung` VARCHAR(191) NULL,
    ADD COLUMN `lantai` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `PeminjamanPeralatan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `peminjamanId` INTEGER NOT NULL,
    `peralatanId` INTEGER NOT NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PeminjamanPeralatan` ADD CONSTRAINT `PeminjamanPeralatan_peminjamanId_fkey` FOREIGN KEY (`peminjamanId`) REFERENCES `Peminjaman`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PeminjamanPeralatan` ADD CONSTRAINT `PeminjamanPeralatan_peralatanId_fkey` FOREIGN KEY (`peralatanId`) REFERENCES `Peralatan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
