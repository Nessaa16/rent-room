import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/serverAuth";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, message: auth.error || "Autentikasi diperlukan." },
        { status: 401 }
      );
    }

    const { id: rawId } = await context.params;
    const id = Number(rawId);
    const body = await req.json();
    const { nama, nimNik, telp, email, fakultas, jenisAkun } = body;

    if (!nama?.trim()) {
      return NextResponse.json({ success: false, message: "Nama diperlukan." }, { status: 400 });
    }

    if (jenisAkun && !["mahasiswa", "dosen"].includes(jenisAkun)) {
      return NextResponse.json({ success: false, message: "Jenis akun tidak valid." }, { status: 400 });
    }

    const existing = await prisma.peminjam.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Peminjam tidak ditemukan." }, { status: 404 });
    }

    if (auth.user.role !== "admin" && existing.email !== auth.user.email) {
      return NextResponse.json(
        { success: false, message: "Tidak dapat mengubah peminjam lain." },
        { status: 403 }
      );
    }

    const updated = await prisma.peminjam.update({
      where: { id },
      data: {
        nama: nama.trim(),
        nimNik: nimNik?.trim() || null,
        telp: telp?.trim() || null,
        email: auth.user.role === "admin" ? email?.trim() || null : auth.user.email,
        fakultas: fakultas?.trim() || null,
        jenisAkun: jenisAkun ?? (auth.user.role === "dosen" ? "dosen" : "mahasiswa"),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating peminjam:", error);
    return NextResponse.json({ success: false, message: "Gagal mengubah data peminjam." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getUserFromRequest(req);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, message: auth.error || "Autentikasi diperlukan." },
        { status: 401 }
      );
    }

    const { id: rawId } = await context.params;
    const id = Number(rawId);

    const existing = await prisma.peminjam.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Peminjam tidak ditemukan." }, { status: 404 });
    }
    if (auth.user.role !== "admin" && existing.email !== auth.user.email) {
      return NextResponse.json(
        { success: false, message: "Tidak dapat menghapus peminjam lain." },
        { status: 403 }
      );
    }

    const activeCount = await prisma.peminjaman.count({
      where: { peminjamId: id, status: { in: ["MENUNGGU", "DISETUJUI"] } },
    });

    if (activeCount > 0) {
      return NextResponse.json(
        { success: false, message: "Peminjam masih memiliki peminjaman aktif. Selesaikan terlebih dahulu." },
        { status: 409 }
      );
    }

    await prisma.peminjam.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting peminjam:", error);
    return NextResponse.json({ success: false, message: "Gagal menghapus peminjam." }, { status: 500 });
  }
}