import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { InternalTokenGuard } from "../../common/guards/internal-token.guard";
import { InternalSubmitReflectionDto } from "./dto/internal-submit-reflection.dto";
import { ReflectionsService } from "./reflections.service";

@UseGuards(InternalTokenGuard)
@Controller("internal/reflections")
export class ReflectionsInternalController {
  constructor(private readonly reflectionsService: ReflectionsService) {}

  @Post("qq-submit")
  submit(@Body() dto: InternalSubmitReflectionDto) {
    return this.reflectionsService.submitFromQq(dto);
  }
}

