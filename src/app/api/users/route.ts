import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { UserService } from "@/server/services";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change_me_secret"
);
const TOKEN_NAME = "rentroom_token";
const userService = new UserService();

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

export async function GET(req: NextRequest) {
  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { success: false, message: adminCheck.error },
      { status: 401 }
    );
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data users." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const adminCheck = await verifyAdmin(req);
  if (!adminCheck.isAdmin) {
    return NextResponse.json(
      { success: false, message: adminCheck.error },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { nama, email, password, role } = body;

    // Validasi field wajib
    if (!nama?.trim()) {
      return NextResponse.json(
        { success: false, message: "Nama wajib diisi." },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, message: "Email wajib diisi." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const validRoles = ["mahasiswa", "dosen"];
    const normalizedRole = typeof role === "string" ? role.toLowerCase().trim() : "mahasiswa";
    if (!validRoles.includes(normalizedRole)) {
      return NextResponse.json(
        {
          success: false,
          message: "Role tidak valid. Pilih mahasiswa atau dosen.",
        },
        { status: 400 }
      );
    }

    // Validasi email unik
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user dengan role mahasiswa
    const newUser = await prisma.user.create({
      data: {
        nama: nama.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: normalizedRole,
      },
      select: {
        id: true,
        nama: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, data: newUser, message: "User berhasil dibuat." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat user." },
      { status: 500 }
    );
  }
}
