import { Controller, Get } from "@nestjs/common";
import { ReflectionsService } from "./reflections.service";

@Controller("public")
export class PublicSummaryController {
  constructor(private readonly reflectionsService: ReflectionsService) {}

  @Get("summary")
  summary() {
    return this.reflectionsService.getPublicSummary();
  }
}

