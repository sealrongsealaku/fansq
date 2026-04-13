import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ReflectionsService } from "./reflections.service";

@UseGuards(JwtAuthGuard)
@Controller("admin/stats")
export class AdminStatsController {
  constructor(private readonly reflectionsService: ReflectionsService) {}

  @Get("overview")
  overview() {
    return this.reflectionsService.getOverviewStats();
  }
}

