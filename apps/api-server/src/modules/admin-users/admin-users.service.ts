import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByUsername(username: string) {
    return this.prisma.adminUser.findUnique({
      where: { username },
    });
  }

  findById(id: bigint) {
    return this.prisma.adminUser.findUnique({
      where: { id },
    });
  }
}

