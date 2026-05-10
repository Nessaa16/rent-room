import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: "ID tidak valid." }, { status: 400 });

    const body = await req.json();
    const { nama, gedung, lantai, kapasitas } = body;

    if (!nama?.trim()) {
      return NextResponse.json({ success: false, message: "Nama ruang diperlukan." }, { status: 400 });
    }
    if (!kapasitas || Number(kapasitas) < 1) {
      return NextResponse.json({ success: false, message: "Kapasitas harus lebih dari 0." }, { status: 400 });
    }

    const updated = await prisma.ruang.update({
      where: { id },
      data: {
        nama: nama.trim(),
        gedung: gedung?.trim() || null,
        lantai: lantai?.trim() || null,
        kapasitas: Number(kapasitas),
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating ruang:", error);
    return NextResponse.json({ success: false, message: "Gagal mengubah ruang." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: "ID tidak valid." }, { status: 400 });

    const ruang = await prisma.ruang.findUnique({ where: { id } });
    if (!ruang) return NextResponse.json({ success: false, message: "Ruang tidak ditemukan." }, { status: 404 });

    const newStatus = ruang.status === "TERSEDIA" ? "DIGUNAKAN" : "TERSEDIA";
    const updated = await prisma.ruang.update({ where: { id }, data: { status: newStatus } });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error toggling ruang status:", error);
    return NextResponse.json({ success: false, message: "Gagal mengubah status ruang." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);
    if (isNaN(id)) return NextResponse.json({ success: false, message: "ID tidak valid." }, { status: 400 });

    const activeCount = await prisma.peminjaman.count({
      where: { ruangId: id, status: { in: ["MENUNGGU", "DISETUJUI"] } },
    });
    if (activeCount > 0) {
      return NextResponse.json(
        { success: false, message: "Ruang masih digunakan dalam peminjaman aktif." },
        { status: 409 }
      );
    }

    await prisma.ruang.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ruang:", error);
    return NextResponse.json({ success: false, message: "Gagal menghapus ruang." }, { status: 500 });
  }
}