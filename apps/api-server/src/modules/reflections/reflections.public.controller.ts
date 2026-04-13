import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { PublicListReflectionsDto } from "./dto/public-list-reflections.dto";
import { PublicSubmitReflectionDto } from "./dto/public-submit-reflection.dto";
import { ReflectionsService } from "./reflections.service";

@Controller("public/reflections")
export class ReflectionsPublicController {
  constructor(private readonly reflectionsService: ReflectionsService) {}

  @Get()
  list(
    @Query() query: PublicListReflectionsDto,
    @Headers("x-visitor-id") visitorId?: string,
  ) {
    return this.reflectionsService.getPublicList(query, visitorId);
  }

  @Get("meta")
  meta() {
    return this.reflectionsService.getPublicSubmitMeta();
  }

  @Post("submit")
  submit(@Body() dto: PublicSubmitReflectionDto) {
    return this.reflectionsService.submitFromPublicForm(dto);
  }

  @Post(":id/like")
  like(
    @Param("id", ParseIntPipe) id: number,
    @Headers("x-visitor-id") visitorId?: string,
  ) {
    return this.reflectionsService.likeReflection(id, visitorId);
  }

  @Get(":id/like-status")
  likeStatus(
    @Param("id", ParseIntPipe) id: number,
    @Headers("x-visitor-id") visitorId?: string,
  ) {
    return this.reflectionsService.getLikeStatus(id, visitorId);
  }
}
