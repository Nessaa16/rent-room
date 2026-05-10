import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/server/services";

const userService = new UserService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const user = await userService.validateUser(email, password);
    const token = userService.generateToken(user);
    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
      },
    });

    response.headers.set("Set-Cookie", userService.getTokenCookie(token));
    return response;
  } catch (error: any) {
    console.error("Error login:", error);
    return NextResponse.json(
      { success: false, message: error?.message || "Gagal login." },
      { status: 400 }
    );
  }
}
