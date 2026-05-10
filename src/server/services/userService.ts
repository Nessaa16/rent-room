import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "@/server/repositories";

const JWT_SECRET = process.env.JWT_SECRET ?? "change_me_secret";
const TOKEN_NAME = "rentroom_token";

export class UserService {
  private repository = new UserRepository();

  async registerUser(data: {
    nama: string;
    email: string;
    password: string;
  }) {
    if (!data.nama?.trim()) {
      throw new Error("Nama harus diisi.");
    }
    if (!data.email?.trim()) {
      throw new Error("Email harus diisi.");
    }
    if (!data.password || data.password.length < 6) {
      throw new Error("Password minimal 6 karakter.");
    }

    const existing = await this.repository.findByEmail(data.email.toLowerCase().trim());
    if (existing) {
      throw new Error("Email sudah terdaftar.");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.repository.create({
      nama: data.nama.trim(),
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin",
    });
  }

  async validateUser(email: string, password: string) {
    if (!email?.trim() || !password) {
      throw new Error("Email dan password harus diisi.");
    }

    const user = await this.repository.findByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new Error("Email atau password salah.");
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error("Email atau password salah.");
    }

    return user;
  }

  generateToken(user: { id: number; email: string; role: string }) {
    return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }

  getTokenCookie(token: string) {
    return `${TOKEN_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; ${process.env.NODE_ENV === "production" ? "Secure;" : ""} Max-Age=604800`;
  }
}
