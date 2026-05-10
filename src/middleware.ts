import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "change_me_secret"
);
const TOKEN_NAME = "rentroom_token";

// Routes yang tidak memerlukan autentikasi
const PUBLIC_ROUTES = ["/login"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware untuk public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  try {
    // Ambil token dari cookies
    const token = request.cookies.get(TOKEN_NAME)?.value;

    if (!token) {
      // Jika tidak ada token, redirect ke login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Verifikasi token
    try {
      await jwtVerify(token, JWT_SECRET);
      // Token valid, lanjutkan
      return NextResponse.next();
    } catch (error) {
      // Token tidak valid, redirect ke login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch (error) {
    // Jika ada error, redirect ke login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match semua request paths kecuali yang dimulai dengan:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
