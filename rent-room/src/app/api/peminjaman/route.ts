import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const peminjaman = await prisma.peminjaman.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        peminjam: true,
        ruang: true,
        peralatanList: {
          include: { peralatan: true },
        },
      },
    });

    const data = peminjaman.map((item) => ({
      ...item,
      status: item.status.toLowerCase(),
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching peminjaman:", error);
    return NextResponse.json({ success: false, message: "Gagal mengambil data peminjaman." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { peminjamId, ruangId, tanggalPakai, durasiJam, keperluan, catatan, peralatanList } = body;

    // Validasi field wajib
    if (!peminjamId) {
      return NextResponse.json({ success: false, message: "Peminjam wajib dipilih." }, { status: 400 });
    }
    if (!ruangId) {
      return NextResponse.json({ success: false, message: "Ruang wajib dipilih." }, { status: 400 });
    }
    if (!tanggalPakai) {
      return NextResponse.json({ success: false, message: "Tanggal pakai wajib diisi." }, { status: 400 });
    }

    // Validasi format tanggal
    const parsedTanggal = new Date(tanggalPakai);
    if (isNaN(parsedTanggal.getTime())) {
      return NextResponse.json({ success: false, message: "Format tanggal pakai tidak valid." }, { status: 400 });
    }

    // Validasi durasi tidak boleh nol atau negatif
    const parsedDurasi = Number(durasiJam);
    if (!durasiJam || isNaN(parsedDurasi) || parsedDurasi <= 0) {
      return NextResponse.json({ success: false, message: "Durasi harus lebih dari 0 jam." }, { status: 400 });
    }

    // Validasi ketersediaan ruang
    const ruang = await prisma.ruang.findUnique({ where: { id: Number(ruangId) } });
    if (!ruang) {
      return NextResponse.json({ success: false, message: "Ruang tidak ditemukan." }, { status: 404 });
    }
    if (ruang.status !== "TERSEDIA") {
      return NextResponse.json({ success: false, message: "Ruang sedang tidak tersedia." }, { status: 409 });
    }

    const konflik = await prisma.peminjaman.findFirst({
      where: {
        ruangId: Number(ruangId),
        tanggalPakai: parsedTanggal,
        status: { in: ["MENUNGGU", "DISETUJUI"] },
      },
    });
    if (konflik) {
      return NextResponse.json(
        { success: false, message: `Ruang sudah ada peminjaman pada tanggal ${parsedTanggal.toLocaleDateString("id-ID")}. Pilih tanggal lain.` },
        { status: 409 }
      );
    }

    // Validasi setiap peralatan
    const validPeralatanList: { peralatanId: number; jumlah: number }[] = [];

    if (Array.isArray(peralatanList) && peralatanList.length > 0) {
      for (const item of peralatanList) {
        const peralatanId = Number(item.peralatanId);
        const jumlah = Number(item.jumlah);

        if (!peralatanId) continue; // baris kosong (belum dipilih)

        // Jumlah tidak boleh nol atau negatif
        if (isNaN(jumlah) || jumlah <= 0) {
          return NextResponse.json(
            { success: false, message: "Jumlah peralatan yang dipinjam harus lebih dari 0." },
            { status: 400 }
          );
        }

        const alat = await prisma.peralatan.findUnique({ where: { id: peralatanId } });
        if (!alat) {
          return NextResponse.json(
            { success: false, message: `Peralatan dengan ID ${peralatanId} tidak ditemukan.` },
            { status: 404 }
          );
        }
        if (alat.status !== "TERSEDIA") {
          return NextResponse.json(
            { success: false, message: `Peralatan "${alat.nama}" sedang tidak tersedia (rusak).` },
            { status: 409 }
          );
        }

        // Jumlah tidak boleh melebihi stok
        if (jumlah > alat.jumlah) {
          return NextResponse.json(
            {
              success: false,
              message: `Stok "${alat.nama}" tidak cukup. Tersedia: ${alat.jumlah} unit, diminta: ${jumlah} unit.`,
            },
            { status: 409 }
          );
        }

        validPeralatanList.push({ peralatanId, jumlah });
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      return tx.peminjaman.create({
        data: {
          peminjamId: Number(peminjamId),
          ruangId: Number(ruangId),
          tanggalPakai: parsedTanggal,
          durasiJam: parsedDurasi,
          keperluan: keperluan?.trim() || undefined,
          catatan: catatan?.trim() || undefined,
          status: "MENUNGGU",
          peralatanList: {
            create: validPeralatanList,
          },
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
      data: { ...created, status: created.status.toLowerCase() },
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating peminjaman:", error);
    return NextResponse.json({ success: false, message: "Gagal membuat peminjaman." }, { status: 500 });
  }
}