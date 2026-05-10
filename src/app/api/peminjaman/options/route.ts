import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/serverAuth";

export async function GET(req: NextRequest) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, message: auth.error || "Autentikasi diperlukan." },
        { status: 401 }
      );
    }

    const peminjamQuery =
      (auth.user.role === "admin" || auth.user.role === "dosen")
        ? prisma.peminjam.findMany({
            orderBy: { nama: "asc" },
            select: { id: true, nama: true, jenisAkun: true, nimNik: true },
          })
        : prisma.peminjam.findMany({
            where: { email: auth.user.email },
            orderBy: { nama: "asc" },
            select: { id: true, nama: true, jenisAkun: true, nimNik: true },
          });

    const [peminjam, ruang, peralatan] = await Promise.all([
      peminjamQuery,
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