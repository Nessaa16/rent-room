import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change_me_secret"
);
const TOKEN_NAME = "rentroom_token";

export async function GET(req: NextRequest) {
  try {
    // Ambil token dari cookies
    const token = req.cookies.get(TOKEN_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    // Verifikasi token
    try {
      const decoded = await jwtVerify(token, JWT_SECRET);
      return NextResponse.json({
        success: true,
        data: {
          user: decoded.payload,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Token tidak valid. Silakan login kembali." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error verifying auth:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memverifikasi autentikasi." },
      { status: 500 }
    );
  }
}
