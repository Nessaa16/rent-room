import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const peralatan = await prisma.peralatan.findMany({ orderBy: { nama: "asc" } });
    return NextResponse.json({ success: true, data: peralatan });
  } catch (error) {
    console.error("Error fetching peralatan:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil data peralatan." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kode, nama, kategori, jumlah } = body;

    if (!kode?.trim()) {
      return NextResponse.json({ success: false, message: "Kode peralatan diperlukan." }, { status: 400 });
    }
    if (!nama?.trim()) {
      return NextResponse.json({ success: false, message: "Nama peralatan diperlukan." }, { status: 400 });
    }
    if (!jumlah || Number(jumlah) < 1) {
      return NextResponse.json({ success: false, message: "Jumlah stok harus lebih dari 0." }, { status: 400 });
    }

    // Cek kode unik
    const existing = await prisma.peralatan.findUnique({ where: { kode: kode.trim().toUpperCase() } });
    if (existing) {
      return NextResponse.json({ success: false, message: `Kode "${kode.toUpperCase()}" sudah digunakan.` }, { status: 409 });
    }

    const created = await prisma.peralatan.create({
      data: {
        kode: kode.trim().toUpperCase(),
        nama: nama.trim(),
        kategori: kategori?.trim() || null,
        jumlah: Number(jumlah),
      },
    });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating peralatan:", error);
    return NextResponse.json({ success: false, message: "Gagal menambah peralatan." }, { status: 500 });
  }
}