import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminJwtPayload } from "../auth/interfaces/admin-jwt-payload.interface";
import { AdminListReflectionsDto } from "./dto/admin-list-reflections.dto";
import { ApproveReflectionDto } from "./dto/approve-reflection.dto";
import { RejectReflectionDto } from "./dto/reject-reflection.dto";
import { SetVisibilityDto } from "./dto/set-visibility.dto";
import { UpdatePublicDisplaySettingDto } from "./dto/update-public-display-setting.dto";
import { UpdateReflectionDto } from "./dto/update-reflection.dto";
import { UpsertReflectionTypeDto } from "./dto/upsert-reflection-type.dto";
import { UpsertTeachingProjectDto } from "./dto/upsert-teaching-project.dto";
import { ReflectionsService } from "./reflections.service";

@UseGuards(JwtAuthGuard)
@Controller("admin/reflections")
export class ReflectionsAdminController {
  constructor(private readonly reflectionsService: ReflectionsService) {}

  @Get()
  list(@Query() query: AdminListReflectionsDto) {
    return this.reflectionsService.getAdminList(query);
  }

  @Get("meta/reflection-types")
  listReflectionTypes() {
    return this.reflectionsService.getAdminReflectionTypes();
  }

  @Post("meta/reflection-types")
  createReflectionType(@Body() dto: UpsertReflectionTypeDto) {
    return this.reflectionsService.createReflectionType(dto);
  }

  @Patch("meta/reflection-types/:id")
  updateReflectionType(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpsertReflectionTypeDto,
  ) {
    return this.reflectionsService.updateReflectionType(id, dto);
  }

  @Delete("meta/reflection-types/:id")
  deleteReflectionType(@Param("id", ParseIntPipe) id: number) {
    return this.reflectionsService.deleteReflectionType(id);
  }

  @Get("meta/teaching-projects")
  listTeachingProjects() {
    return this.reflectionsService.getAdminTeachingProjects();
  }

  @Get("meta/display-settings")
  getDisplaySettings() {
    return this.reflectionsService.getAdminPublicDisplaySettings();
  }

  @Patch("meta/display-settings")
  updateDisplaySettings(@Body() dto: UpdatePublicDisplaySettingDto) {
    return this.reflectionsService.updateAdminPublicDisplaySettings(dto.show_view_count);
  }

  @Post("meta/teaching-projects")
  createTeachingProject(@Body() dto: UpsertTeachingProjectDto) {
    return this.reflectionsService.createTeachingProject(dto);
  }

  @Patch("meta/teaching-projects/:id")
  updateTeachingProject(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpsertTeachingProjectDto,
  ) {
    return this.reflectionsService.updateTeachingProject(id, dto);
  }

  @Delete("meta/teaching-projects/:id")
  deleteTeachingProject(@Param("id", ParseIntPipe) id: number) {
    return this.reflectionsService.deleteTeachingProject(id);
  }

  @Get("export")
  async export(@Query() query: AdminListReflectionsDto, @Res({ passthrough: true }) res: any) {
    const payload = await this.reflectionsService.exportAdminReflections(query);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${payload.filename}"`);
    return payload.content;
  }

  @Get(":id")
  detail(@Param("id", ParseIntPipe) id: number) {
    return this.reflectionsService.getAdminDetail(id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateReflectionDto,
    @CurrentUser() user: AdminJwtPayload,
  ) {
    return this.reflectionsService.updateReflection(id, dto, user.sub);
  }

  @Post(":id/approve")
  approve(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ApproveReflectionDto,
    @CurrentUser() user: AdminJwtPayload,
  ) {
    return this.reflectionsService.approveReflection(id, dto, user.sub);
  }

  @Post(":id/reject")
  reject(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: RejectReflectionDto,
    @CurrentUser() user: AdminJwtPayload,
  ) {
    return this.reflectionsService.rejectReflection(id, dto, user.sub);
  }

  @Post(":id/visibility")
  visibility(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: SetVisibilityDto,
    @CurrentUser() user: AdminJwtPayload,
  ) {
    return this.reflectionsService.setVisibility(id, dto, user.sub);
  }

  @Delete(":id")
  remove(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AdminJwtPayload,
  ) {
    return this.reflectionsService.deleteReflection(id, user.sub);
  }
}
