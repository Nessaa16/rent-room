import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ruangId = searchParams.get("ruangId");
    const tanggalPakai = searchParams.get("tanggalPakai");

    if (!ruangId || !tanggalPakai) {
      return NextResponse.json(
        { success: false, message: "Ruang dan tanggal wajib diisi." },
        { status: 400 }
      );
    }

    const parsedTanggal = new Date(tanggalPakai);
    if (isNaN(parsedTanggal.getTime())) {
      return NextResponse.json(
        { success: false, message: "Format tanggal pakai tidak valid." },
        { status: 400 }
      );
    }

    const ruang = await prisma.ruang.findUnique({ where: { id: Number(ruangId) } });
    if (!ruang) {
      return NextResponse.json(
        { success: false, message: "Ruang tidak ditemukan." },
        { status: 404 }
      );
    }

    if (ruang.status !== "TERSEDIA") {
      return NextResponse.json(
        { success: false, message: "Ruang sudah dipesan pada waktu tersebut." },
        { status: 409 }
      );
    }

    const conflito = await prisma.peminjaman.findFirst({
      where: {
        ruangId: Number(ruangId),
        tanggalPakai: parsedTanggal,
        status: { in: ["MENUNGGU", "DISETUJUI"] },
      },
    });

    if (conflito) {
      return NextResponse.json(
        { success: false, message: "Ruang sudah dipesan pada waktu tersebut." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, data: { available: true } });
  } catch (error) {
    console.error("Error checking room availability:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memeriksa ketersediaan ruangan." },
      { status: 500 }
    );
  }
}
