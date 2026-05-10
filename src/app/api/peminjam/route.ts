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

    const whereClause = (auth.user.role === "admin" || auth.user.role === "dosen")
      ? undefined
      : { email: auth.user.email };

    const peminjam = await prisma.peminjam.findMany({
      where: whereClause,
      orderBy: { nama: "asc" },
    });
    return NextResponse.json({ success: true, data: peminjam });
  } catch (error) {
    console.error("Error fetching peminjam:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data peminjam." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await getUserFromRequest(req);
    if (!auth.user) {
      return NextResponse.json(
        { success: false, message: auth.error || "Autentikasi diperlukan." },
        { status: 401 }
      );
    }

    const { nama, nimNik, telp, email, fakultas, jenisAkun } = body;

    if (!nama?.trim()) {
      return NextResponse.json(
        { success: false, message: "Nama diperlukan." },
        { status: 400 }
      );
    }

    if (jenisAkun && !["mahasiswa", "dosen"].includes(jenisAkun)) {
      return NextResponse.json(
        { success: false, message: "Jenis akun tidak valid." },
        { status: 400 }
      );
    }

    const created = await prisma.peminjam.create({
      data: {
        nama: nama.trim(),
        nimNik: nimNik?.trim() || undefined,
        telp: telp?.trim() || undefined,
        email: auth.user.role === "admin" ? email?.trim() || undefined : auth.user.email,
        fakultas: fakultas?.trim() || undefined,
        jenisAkun: jenisAkun ?? (auth.user.role === "dosen" ? "dosen" : "mahasiswa"),
      },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating peminjam:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat peminjam." },
      { status: 500 }
    );
  }
}