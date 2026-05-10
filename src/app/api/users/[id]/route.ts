import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change_me_secret"
);
const TOKEN_NAME = "rentroom_token";

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get(TOKEN_NAME)?.value;

  if (!token) {
    return { isAdmin: false, error: "Token tidak ditemukan." };
  }

  try {
    const decoded = await jwtVerify(token, JWT_SECRET);
    if (decoded.payload.role !== "admin") {
      return { isAdmin: false, error: "Hanya admin yang dapat mengakses." };
    }
    return { isAdmin: true, user: decoded.payload };
  } catch {
    return { isAdmin: false, error: "Token tidak valid." };
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { success: false, message: adminCheck.error },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const userId = Number(id);
    const body = await req.json();
    const { nama, email, password, role } = body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (nama) {
      if (!nama.trim()) {
        return NextResponse.json(
          { success: false, message: "Nama tidak boleh kosong." },
          { status: 400 }
        );
      }
      updateData.nama = nama.trim();
    }

    if (email) {
      if (!email.trim()) {
        return NextResponse.json(
          { success: false, message: "Email tidak boleh kosong." },
          { status: 400 }
        );
      }

      if (email.toLowerCase().trim() !== user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (existing) {
          return NextResponse.json(
            { success: false, message: "Email sudah terdaftar." },
            { status: 409 }
          );
        }
      }

      updateData.email = email.toLowerCase().trim();
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, message: "Password minimal 6 karakter." },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (role) {
      const validRoles = ["mahasiswa", "dosen"];
      const normalizedRole = String(role).toLowerCase().trim();
      if (!validRoles.includes(normalizedRole)) {
        return NextResponse.json(
          {
            success: false,
            message: "Role tidak valid. Pilih mahasiswa atau dosen.",
          },
          { status: 400 }
        );
      }
      updateData.role = normalizedRole;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "User berhasil diperbarui.",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui user." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { success: false, message: adminCheck.error },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const userId = Number(id);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan." },
        { status: 404 }
      );
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { success: false, message: "Tidak bisa menghapus user admin." },
        { status: 403 }
      );
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus.",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus user." },
      { status: 500 }
    );
  }
}