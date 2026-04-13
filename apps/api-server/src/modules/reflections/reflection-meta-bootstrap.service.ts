import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ReflectionMetaBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(ReflectionMetaBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.reflectionType.count();
    if (count > 0) {
      return;
    }

    await this.prisma.reflectionType.createMany({
      data: [
        {
          name: "教学反思",
          code: "teaching_reflection",
          requiresProject: true,
          sortOrder: 1,
        },
        {
          name: "线下活动感想",
          code: "offline_activity",
          requiresProject: false,
          sortOrder: 2,
        },
        {
          name: "其它",
          code: "other",
          requiresProject: false,
          sortOrder: 3,
        },
      ],
    });

    this.logger.log("default reflection types have been created");
  }
}
