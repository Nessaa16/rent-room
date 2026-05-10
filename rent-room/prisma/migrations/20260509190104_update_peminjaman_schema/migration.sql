-- CreateTable
CREATE TABLE `Peminjam` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `nimNik` VARCHAR(191) NULL,
    `telp` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `fakultas` VARCHAR(191) NULL,
    `jenisAkun` VARCHAR(191) NOT NULL DEFAULT 'mahasiswa',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ruang` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `lokasi` VARCHAR(191) NULL,
    `kapasitas` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('TERSEDIA', 'DIGUNAKAN') NOT NULL DEFAULT 'TERSEDIA',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Peralatan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `tipe` VARCHAR(191) NULL,
    `jumlah` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('TERSEDIA', 'RUSAK') NOT NULL DEFAULT 'TERSEDIA',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Peminjaman` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `peminjamId` INTEGER NOT NULL,
    `ruangId` INTEGER NOT NULL,
    `peralatanId` INTEGER NULL,
    `tanggalPinjam` DATETIME(3) NOT NULL,
    `tanggalKembali` DATETIME(3) NULL,
    `durasiJam` INTEGER NULL,
    `tanggalKembaliAktual` DATETIME(3) NULL,
    `keperluan` VARCHAR(191) NULL,
    `status` ENUM('MENUNGGU', 'DISETUJUI', 'DITOLAK', 'SELESAI') NOT NULL DEFAULT 'MENUNGGU',
    `catatan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Peminjaman` ADD CONSTRAINT `Peminjaman_peminjamId_fkey` FOREIGN KEY (`peminjamId`) REFERENCES `Peminjam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Peminjaman` ADD CONSTRAINT `Peminjaman_ruangId_fkey` FOREIGN KEY (`ruangId`) REFERENCES `Ruang`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Peminjaman` ADD CONSTRAINT `Peminjaman_peralatanId_fkey` FOREIGN KEY (`peralatanId`) REFERENCES `Peralatan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
