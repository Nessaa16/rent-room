import { NextRequest } from "next/server";
import { jwtVerify, JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change_me_secret"
);
const TOKEN_NAME = "rentroom_token";

export interface AuthUser {
  id: number;
  email: string;
  nama?: string;
  role: string;
}

export async function getUserFromRequest(req: NextRequest): Promise<{ user?: AuthUser; error?: string }> {
  const token = req.cookies.get(TOKEN_NAME)?.value;
  if (!token) {
    return { error: "Token tidak ditemukan." };
  }

  try {
    const decoded = await jwtVerify(token, JWT_SECRET);
    const payload = decoded.payload as JWTPayload;
    return {
      user: {
        id: Number(payload.id),
        email: String(payload.email ?? ""),
        nama: payload.nama ? String(payload.nama) : undefined,
        role: String(payload.role ?? ""),
      },
    };
  } catch (error) {
    return { error: "Token tidak valid." };
  }
}

export async function verifyAdmin(req: NextRequest): Promise<{ isAdmin: boolean; error?: string; user?: AuthUser }> {
  const result = await getUserFromRequest(req);
  if (!result.user) {
    return { isAdmin: false, error: result.error };
  }
  if (result.user.role !== "admin") {
    return { isAdmin: false, error: "Hanya admin yang dapat mengakses." };
  }
  return { isAdmin: true, user: result.user };
}
