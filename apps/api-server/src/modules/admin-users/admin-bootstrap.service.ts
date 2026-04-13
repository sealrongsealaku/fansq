import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const username = this.configService.get<string>("ADMIN_INIT_USERNAME");
    const passwordHash = this.configService.get<string>("ADMIN_INIT_PASSWORD_HASH");

    if (!username || !passwordHash || passwordHash.includes("replace_with_hash")) {
      this.logger.log("skip admin bootstrap because admin init env is not configured");
      return;
    }

    const existingUser = await this.prisma.adminUser.findUnique({
      where: { username },
    });

    if (existingUser) {
      this.logger.log(`admin user "${username}" already exists`);
      return;
    }

    await this.prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        role: "admin",
      },
    });

    this.logger.log(`admin user "${username}" has been created from env`);
  }
}

