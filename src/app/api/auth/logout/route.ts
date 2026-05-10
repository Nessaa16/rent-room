import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logout berhasil." });
  response.headers.set("Set-Cookie", "rentroom_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return response;
}
