import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/serverAuth";

const VALID_TRANSITIONS: Record<string, string[]> = {
  MENUNGGU: ["DISETUJUI", "DITOLAK"],
  DISETUJUI: ["SELESAI", "DITOLAK"],
};

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { success: false, message: adminCheck.error || "Hanya admin yang dapat mengakses." },
      { status: 401 }
    );
  }

  try {
    const { id: rawId } = await context.params;
    const id = Number(rawId);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "ID tidak valid." }, { status: 400 });
    }

    const body = await req.json();
    const { status, catatanPenolakan, waktuPengembalianAktual } = body;

    const validStatuses = ["MENUNGGU", "DISETUJUI", "DITOLAK", "SELESAI"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: "Status tidak valid." }, { status: 400 });
    }

    const existing = await prisma.peminjaman.findUnique({
      where: { id },
      include: {
        peralatanList: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Peminjaman tidak ditemukan." }, { status: 404 });
    }

    const allowed = VALID_TRANSITIONS[existing.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Tidak dapat mengubah status dari "${existing.status}" ke "${status}".` },
        { status: 409 }
      );
    }

    if (status === "DITOLAK" && !catatanPenolakan?.trim()) {
      return NextResponse.json(
        { success: false, message: "Alasan penolakan wajib diisi." },
        { status: 400 }
      );
    }

    let resolvedWaktuPengembalian: Date | undefined = undefined;
    if (status === "SELESAI") {
      resolvedWaktuPengembalian = waktuPengembalianAktual
        ? new Date(waktuPengembalianAktual)
        : new Date();
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Kurangi stok saat disetujui
      if (status === "DISETUJUI") {
        for (const item of existing.peralatanList) {
          await tx.peralatan.update({
            where: { id: item.peralatanId },
            data: { jumlah: { decrement: item.jumlah } },
          });
        }
      }

      // Kembalikan stok saat DITOLAK (dari disetujui) atau selesai
      if (
        (status === "DITOLAK" && existing.status === "DISETUJUI") ||
        status === "SELESAI"
      ) {
        for (const item of existing.peralatanList) {
          await tx.peralatan.update({
            where: { id: item.peralatanId },
            data: { jumlah: { increment: item.jumlah } },
          });
        }
      }

      return tx.peminjaman.update({
        where: { id },
        data: {
          status,
          catatanPenolakan: status === "DITOLAK" ? catatanPenolakan.trim() : null,
          ...(resolvedWaktuPengembalian !== undefined && {
            waktuPengembalianAktual: resolvedWaktuPengembalian,
          }),
        },
        include: {
          peminjam: true,
          ruang: true,
          peralatanList: { include: { peralatan: true } },
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: { ...updated, status: updated.status.toLowerCase() },
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json({ success: false, message: "Gagal mengubah status." }, { status: 500 });
  }
}