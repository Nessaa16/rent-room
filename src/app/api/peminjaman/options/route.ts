import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [peminjam, ruang, peralatan] = await Promise.all([
      prisma.peminjam.findMany({
        orderBy: { nama: "asc" },
        select: { id: true, nama: true, jenisAkun: true, nimNik: true },
      }),
      prisma.ruang.findMany({
        orderBy: { nama: "asc" },
        select: {
          id: true,
          nama: true,
          gedung: true,
          lantai: true,
          kapasitas: true,
          status: true,
        },
      }),
      prisma.peralatan.findMany({
        orderBy: { nama: "asc" },
        select: {
          id: true,
          nama: true,
          kategori: true,
          jumlah: true,
          status: true,
        },
      }),
    ]);

    // Normalisasi agar frontend mendapat field yang konsisten
    const ruangNormalized = ruang.map((r) => ({
      ...r,
      tersedia: r.status === "TERSEDIA",
    }));

    const peralatanNormalized = peralatan.map((p) => ({
      ...p,
      stok: p.jumlah, // alias agar frontend bisa pakai "stok"
    }));

    return NextResponse.json({
      success: true,
      data: { peminjam, ruang: ruangNormalized, peralatan: peralatanNormalized },
    });
  } catch (error) {
    console.error("Error fetching options:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data opsi." },
      { status: 500 }
    );
  }
}