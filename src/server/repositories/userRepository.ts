import { prisma } from "@/lib/prisma";
import { BaseRepository } from "./BaseRepository";

export class UserRepository extends BaseRepository<any> {
  constructor() {
    super(prisma.user);
  }

  async findByEmail(email: string) {
    try {
      if (!prisma || !prisma.user) {
        throw new Error("Prisma client is not initialized");
      }
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error("Error finding user by email:", error);
      throw error;
    }
  }
}
