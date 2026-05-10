import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const ruang = await prisma.ruang.findMany({ orderBy: { nama: "asc" } });
    return NextResponse.json({ success: true, data: ruang });
  } catch (error) {
    console.error("Error fetching ruang:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil data ruang." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, gedung, lantai, kapasitas } = body;

    if (!nama?.trim()) {
      return NextResponse.json({ success: false, message: "Nama ruang diperlukan." }, { status: 400 });
    }
    if (!kapasitas || Number(kapasitas) < 1) {
      return NextResponse.json({ success: false, message: "Kapasitas harus lebih dari 0." }, { status: 400 });
    }

    const created = await prisma.ruang.create({
      data: {
        nama: nama.trim(),
        gedung: gedung?.trim() || null,
        lantai: lantai?.trim() || null,
        kapasitas: Number(kapasitas),
      },
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating ruang:", error);
    return NextResponse.json({ success: false, message: "Gagal menambah ruang." }, { status: 500 });
  }
}