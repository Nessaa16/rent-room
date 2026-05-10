import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { success: false, message: adminCheck.error || "Hanya admin yang dapat mengakses." },
      { status: 401 }
    );
  }

  try {
    const [
      totalPeminjam,
      totalRuang,
      totalPeralatan,
      totalPeminjaman,
      statusGroup,
      recentRaw,
    ] = await Promise.all([
      prisma.peminjam.count(),
      prisma.ruang.count(),
      prisma.peralatan.count(),
      prisma.peminjaman.count(),
      prisma.peminjaman.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.peminjaman.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          peminjam: { select: { nama: true } },
          ruang: { select: { nama: true } },
        },
      }),
    ]);

    const stats = {
      totalPeminjam,
      totalRuang,
      totalPeralatan,
      totalPeminjaman,
      menunggu:  statusGroup.find((s) => s.status === "MENUNGGU")?._count.status  ?? 0,
      disetujui: statusGroup.find((s) => s.status === "DISETUJUI")?._count.status ?? 0,
      ditolak:   statusGroup.find((s) => s.status === "DITOLAK")?._count.status   ?? 0,
      selesai:   statusGroup.find((s) => s.status === "SELESAI")?._count.status   ?? 0,
    };

    const recentPeminjaman = recentRaw.map((item) => ({
      id: item.id,
      nama_peminjam: item.peminjam.nama,
      nama_ruang: item.ruang.nama,
      tanggal_pakai: item.tanggalPakai.toISOString().split("T")[0],
      status: item.status.toLowerCase() as "menunggu" | "disetujui" | "ditolak" | "selesai",
    }));

    return NextResponse.json({ success: true, data: { stats, recentPeminjaman } });
  } catch (error) {
    console.error("[dashboard] GET error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data dashboard." },
      { status: 500 }
    );
  }
}