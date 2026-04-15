import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminListReflectionsDto } from "./dto/admin-list-reflections.dto";
import { ApproveReflectionDto } from "./dto/approve-reflection.dto";
import { InternalSubmitReflectionDto } from "./dto/internal-submit-reflection.dto";
import { PublicListReflectionsDto } from "./dto/public-list-reflections.dto";
import { PublicSubmitReflectionDto } from "./dto/public-submit-reflection.dto";
import { RejectReflectionDto } from "./dto/reject-reflection.dto";
import { SetVisibilityDto } from "./dto/set-visibility.dto";
import { UpdateReflectionDto } from "./dto/update-reflection.dto";
import { UpsertReflectionTypeDto } from "./dto/upsert-reflection-type.dto";
import { UpsertTeachingProjectDto } from "./dto/upsert-teaching-project.dto";

@Injectable()
export class ReflectionsService {
  private readonly publicDisplaySettingId = 1;
  private readonly reflectionViewDedupMinutes = 30;

  constructor(private readonly prisma: PrismaService) {}

  private async ensurePublicDisplaySetting() {
    return this.prisma.publicDisplaySetting.upsert({
      where: { id: this.publicDisplaySettingId },
      update: {},
      create: {
        id: this.publicDisplaySettingId,
      },
    });
  }

  private async createAuditLog(
    reflectionId: bigint,
    adminUserId: number,
    action: string,
    actionDetail?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        reflectionId,
        adminUserId: BigInt(adminUserId),
        action,
        actionDetail,
      },
    });
  }

  private buildAdminWhere(query: AdminListReflectionsDto): Prisma.ReflectionWhereInput {
    return {
      ...(query.keyword
        ? {
            OR: [
              { studentName: { contains: query.keyword } },
              { reflectionTitle: { contains: query.keyword } },
              { submitContent: { contains: query.keyword } },
              { displayName: { contains: query.keyword } },
              { reflectionType: { name: { contains: query.keyword } } },
              { teachingProject: { name: { contains: query.keyword } } },
            ],
          }
        : {}),
      ...(query.audit_status ? { auditStatus: query.audit_status } : {}),
      ...(query.display_status ? { displayStatus: query.display_status } : {}),
      ...(query.source_group_id ? { sourceGroupId: query.source_group_id } : {}),
      ...(query.reflection_type_id
        ? { reflectionTypeId: BigInt(query.reflection_type_id) }
        : {}),
      ...(query.teaching_project_id
        ? { teachingProjectId: BigInt(query.teaching_project_id) }
        : {}),
      ...(query.is_top !== undefined ? { isTop: query.is_top } : {}),
      ...(query.start_time || query.end_time
        ? {
            submitTime: {
              ...(query.start_time ? { gte: new Date(query.start_time) } : {}),
              ...(query.end_time ? { lte: new Date(query.end_time) } : {}),
            },
          }
        : {}),
    };
  }

  private buildPublicWhere(query: PublicListReflectionsDto): Prisma.ReflectionWhereInput {
    return {
      auditStatus: "approved",
      displayStatus: "visible",
      ...(query.featured_only ? { isFeatured: true } : {}),
      ...(query.keyword
        ? {
            OR: [
              { studentName: { contains: query.keyword } },
              { displayName: { contains: query.keyword } },
              { reflectionTitle: { contains: query.keyword } },
              { submitContent: { contains: query.keyword } },
              { reflectionType: { name: { contains: query.keyword } } },
              { teachingProject: { name: { contains: query.keyword } } },
            ],
          }
        : {}),
    };
  }

  private escapeCsvValue(value: string | number | boolean | null | undefined) {
    const normalized =
      value === null || value === undefined ? "" : String(value).replace(/\r?\n/g, "\n");
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }

  private mapAdminReflection(item: Awaited<ReturnType<typeof this.getReflectionById>>) {
    if (!item) {
      throw new NotFoundException("reflection_not_found");
    }

    return {
      id: Number(item.id),
      student_name: item.studentName,
      reflection_title: item.reflectionTitle,
      submit_content: item.submitContent,
      submit_time: item.submitTime.toISOString(),
      submit_channel: item.submitChannel,
      source_group_id: item.sourceGroupId,
      source_group_name: item.sourceGroupName,
      raw_message_id: item.rawMessageId,
      reflection_type_id: item.reflectionTypeId ? Number(item.reflectionTypeId) : null,
      reflection_type_name: item.reflectionType?.name ?? null,
      teaching_project_id: item.teachingProjectId ? Number(item.teachingProjectId) : null,
      teaching_project_name: item.teachingProject?.name ?? null,
      audit_status: item.auditStatus,
      display_status: item.displayStatus,
      is_featured: item.isFeatured,
      is_top: item.isTop,
      is_anonymous: item.isAnonymous,
      display_name: item.displayName,
      like_count: item.likeCount,
      view_count: item.viewCount,
      remarks: item.remarks,
      created_at: item.createdAt.toISOString(),
      updated_at: item.updatedAt.toISOString(),
    };
  }

  private async getReflectionById(id: bigint) {
    return this.prisma.reflection.findUnique({
      where: { id },
      include: {
        reflectionType: true,
        teachingProject: true,
      },
    });
  }

  private async getActiveReflectionTypeOrThrow(id: number) {
    const reflectionType = await this.prisma.reflectionType.findFirst({
      where: {
        id: BigInt(id),
        isActive: true,
      },
    });

    if (!reflectionType) {
      throw new BadRequestException("reflection_type_invalid");
    }

    return reflectionType;
  }

  private async getActiveTeachingProjectOrThrow(id: number) {
    const project = await this.prisma.teachingProject.findFirst({
      where: {
        id: BigInt(id),
        isActive: true,
      },
    });

    if (!project) {
      throw new BadRequestException("teaching_project_invalid");
    }

    return project;
  }

  private async validatePublicReflectionMeta(
    reflectionTypeId: number,
    teachingProjectId?: number,
  ) {
    const reflectionType = await this.getActiveReflectionTypeOrThrow(reflectionTypeId);

    if (reflectionType.requiresProject) {
      if (!teachingProjectId) {
        throw new BadRequestException("teaching_project_required");
      }
      await this.getActiveTeachingProjectOrThrow(teachingProjectId);
    }

    if (!reflectionType.requiresProject && teachingProjectId) {
      await this.getActiveTeachingProjectOrThrow(teachingProjectId);
    }

    return reflectionType;
  }

  private async validateAdminReflectionMeta(
    reflectionTypeId: bigint | null,
    teachingProjectId: bigint | null,
  ) {
    if (!reflectionTypeId) {
      return;
    }

    const reflectionType = await this.prisma.reflectionType.findUnique({
      where: { id: reflectionTypeId },
    });

    if (!reflectionType) {
      throw new BadRequestException("reflection_type_invalid");
    }

    if (reflectionType.requiresProject && !teachingProjectId) {
      throw new BadRequestException("teaching_project_required");
    }

    if (teachingProjectId) {
      const project = await this.prisma.teachingProject.findUnique({
        where: { id: teachingProjectId },
      });

      if (!project) {
        throw new BadRequestException("teaching_project_invalid");
      }
    }
  }

  async getPublicSubmitMeta() {
    const [reflectionTypes, teachingProjects] = await this.prisma.$transaction([
      this.prisma.reflectionType.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
      this.prisma.teachingProject.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
    ]);

    return {
      success: true,
      message: "ok",
      data: {
        reflection_types: reflectionTypes.map((item) => ({
          id: Number(item.id),
          name: item.name,
          code: item.code,
          requires_project: item.requiresProject,
          sort_order: item.sortOrder,
        })),
        teaching_projects: teachingProjects.map((item) => ({
          id: Number(item.id),
          name: item.name,
          code: item.code,
          sort_order: item.sortOrder,
        })),
      },
    };
  }

  async getAdminPublicDisplaySettings() {
    const setting = await this.ensurePublicDisplaySetting();

    return {
      success: true,
      message: "ok",
      data: {
        show_view_count: setting.showViewCount,
      },
    };
  }

  async updateAdminPublicDisplaySettings(showViewCount: boolean) {
    const setting = await this.prisma.publicDisplaySetting.upsert({
      where: { id: this.publicDisplaySettingId },
      update: {
        showViewCount,
      },
      create: {
        id: this.publicDisplaySettingId,
        showViewCount,
      },
    });

    return {
      success: true,
      message: "updated",
      data: {
        show_view_count: setting.showViewCount,
      },
    };
  }

  async getAdminReflectionTypes() {
    const list = await this.prisma.reflectionType.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return {
      success: true,
      message: "ok",
      data: {
        list: list.map((item) => ({
          id: Number(item.id),
          name: item.name,
          code: item.code,
          requires_project: item.requiresProject,
          is_active: item.isActive,
          sort_order: item.sortOrder,
        })),
      },
    };
  }

  async createReflectionType(dto: UpsertReflectionTypeDto) {
    try {
      const created = await this.prisma.reflectionType.create({
        data: {
          name: dto.name,
          code: dto.code,
          requiresProject: dto.requires_project ?? false,
          isActive: dto.is_active ?? true,
          sortOrder: dto.sort_order ?? 0,
        },
      });

      return {
        success: true,
        message: "created",
        data: {
          id: Number(created.id),
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("reflection_type_code_exists");
      }
      throw error;
    }
  }

  async updateReflectionType(id: number, dto: UpsertReflectionTypeDto) {
    const targetId = BigInt(id);
    const existing = await this.prisma.reflectionType.findUnique({
      where: { id: targetId },
    });

    if (!existing) {
      throw new NotFoundException("reflection_type_not_found");
    }

    try {
      await this.prisma.reflectionType.update({
        where: { id: targetId },
        data: {
          name: dto.name,
          code: dto.code,
          requiresProject: dto.requires_project ?? false,
          isActive: dto.is_active ?? true,
          sortOrder: dto.sort_order ?? 0,
        },
      });

      return {
        success: true,
        message: "updated",
        data: { id },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("reflection_type_code_exists");
      }
      throw error;
    }
  }

  async deleteReflectionType(id: number) {
    const targetId = BigInt(id);
    const existing = await this.prisma.reflectionType.findUnique({
      where: { id: targetId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("reflection_type_not_found");
    }

    const linkedCount = await this.prisma.reflection.count({
      where: { reflectionTypeId: targetId },
    });

    if (linkedCount > 0) {
      throw new ConflictException("reflection_type_in_use");
    }

    await this.prisma.reflectionType.delete({
      where: { id: targetId },
    });

    return {
      success: true,
      message: "deleted",
      data: { id },
    };
  }

  async getAdminTeachingProjects() {
    const list = await this.prisma.teachingProject.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return {
      success: true,
      message: "ok",
      data: {
        list: list.map((item) => ({
          id: Number(item.id),
          name: item.name,
          code: item.code,
          is_active: item.isActive,
          sort_order: item.sortOrder,
        })),
      },
    };
  }

  async createTeachingProject(dto: UpsertTeachingProjectDto) {
    try {
      const created = await this.prisma.teachingProject.create({
        data: {
          name: dto.name,
          code: dto.code || null,
          isActive: dto.is_active ?? true,
          sortOrder: dto.sort_order ?? 0,
        },
      });

      return {
        success: true,
        message: "created",
        data: {
          id: Number(created.id),
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("teaching_project_code_exists");
      }
      throw error;
    }
  }

  async updateTeachingProject(id: number, dto: UpsertTeachingProjectDto) {
    const targetId = BigInt(id);
    const existing = await this.prisma.teachingProject.findUnique({
      where: { id: targetId },
    });

    if (!existing) {
      throw new NotFoundException("teaching_project_not_found");
    }

    try {
      await this.prisma.teachingProject.update({
        where: { id: targetId },
        data: {
          name: dto.name,
          code: dto.code || null,
          isActive: dto.is_active ?? true,
          sortOrder: dto.sort_order ?? 0,
        },
      });

      return {
        success: true,
        message: "updated",
        data: { id },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("teaching_project_code_exists");
      }
      throw error;
    }
  }

  async deleteTeachingProject(id: number) {
    const targetId = BigInt(id);
    const existing = await this.prisma.teachingProject.findUnique({
      where: { id: targetId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("teaching_project_not_found");
    }

    const linkedCount = await this.prisma.reflection.count({
      where: { teachingProjectId: targetId },
    });

    if (linkedCount > 0) {
      throw new ConflictException("teaching_project_in_use");
    }

    await this.prisma.teachingProject.delete({
      where: { id: targetId },
    });

    return {
      success: true,
      message: "deleted",
      data: { id },
    };
  }

  async submitFromQq(dto: InternalSubmitReflectionDto) {
    const content = dto.submit_content.trim();
    if (!content) {
      throw new BadRequestException("submit_content_required");
    }

    const reflection = await this.prisma.reflection.create({
      data: {
        studentName: dto.student_name.trim(),
        reflectionTitle: dto.reflection_title?.trim() || null,
        submitContent: content,
        submitTime: new Date(dto.submit_time),
        submitChannel: dto.submit_channel,
        sourceGroupId: dto.source_group_id,
        sourceGroupName: dto.source_group_name,
        rawMessageId: dto.raw_message_id,
        auditStatus: "pending",
        displayStatus: "hidden",
      },
    });

    return {
      success: true,
      message: "received",
      data: {
        id: Number(reflection.id),
        audit_status: reflection.auditStatus,
        display_status: reflection.displayStatus,
      },
    };
  }

  async submitFromPublicForm(dto: PublicSubmitReflectionDto) {
    const studentName = dto.student_name.trim();
    const reflectionTitle = dto.reflection_title.trim();
    const content = dto.submit_content.trim();

    if (!studentName) {
      throw new BadRequestException("student_name_required");
    }

    if (!content) {
      throw new BadRequestException("submit_content_required");
    }

    if (!reflectionTitle) {
      throw new BadRequestException("reflection_title_required");
    }

    await this.validatePublicReflectionMeta(dto.reflection_type_id, dto.teaching_project_id);

    const reflection = await this.prisma.reflection.create({
      data: {
        studentName,
        reflectionTitle,
        submitContent: content,
        submitTime: new Date(),
        submitChannel: "website_form",
        reflectionTypeId: BigInt(dto.reflection_type_id),
        teachingProjectId: dto.teaching_project_id
          ? BigInt(dto.teaching_project_id)
          : null,
        auditStatus: "pending",
        displayStatus: "hidden",
        isAnonymous: dto.is_anonymous ?? false,
      },
    });

    return {
      success: true,
      message: "submitted",
      data: {
        id: Number(reflection.id),
        audit_status: reflection.auditStatus,
        display_status: reflection.displayStatus,
      },
    };
  }

  async getAdminList(query: AdminListReflectionsDto) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const where = this.buildAdminWhere(query);

    const [list, total] = await this.prisma.$transaction([
      this.prisma.reflection.findMany({
        where,
        include: {
          reflectionType: true,
          teachingProject: true,
        },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.reflection.count({ where }),
    ]);

    return {
      success: true,
      message: "ok",
      data: {
        list: list.map((item) => this.mapAdminReflection(item)),
        pagination: {
          page,
          page_size: pageSize,
          total,
        },
      },
    };
  }

  async exportAdminReflections(query: AdminListReflectionsDto) {
    const where = this.buildAdminWhere(query);
    const list = await this.prisma.reflection.findMany({
      where,
      include: {
        reflectionType: true,
        teachingProject: true,
      },
      orderBy: [{ submitTime: "desc" }, { createdAt: "desc" }],
    });

    const header = [
      "ID",
      "提交人",
      "反思标题",
      "反思类型",
      "支教项目",
      "展示名",
      "匿名展示",
      "反思内容",
      "提交时间",
      "提交渠道",
      "来源群",
      "审核状态",
      "展示状态",
      "精选",
      "置顶",
      "点赞数",
      "备注",
      "创建时间",
      "更新时间",
    ];

    header.splice(16, 0, "view_count");

    const rows = list.map((item) => [
      Number(item.id),
      item.studentName,
      item.reflectionTitle ?? "",
      item.reflectionType?.name ?? "",
      item.teachingProject?.name ?? "",
      item.displayName ?? "",
      item.isAnonymous ? "是" : "否",
      item.submitContent,
      item.submitTime.toISOString(),
      item.submitChannel,
      item.sourceGroupName ?? "",
      item.auditStatus,
      item.displayStatus,
      item.isFeatured ? "是" : "否",
      item.isTop ? "是" : "否",
      item.likeCount,
      item.viewCount,
      item.remarks ?? "",
      item.createdAt.toISOString(),
      item.updatedAt.toISOString(),
    ]);

    const lines = [header, ...rows]
      .map((row) => row.map((value) => this.escapeCsvValue(value)).join(","))
      .join("\r\n");

    return {
      filename: `fansq-reflections-${new Date().toISOString().slice(0, 10)}.csv`,
      content: `\uFEFF${lines}`,
    };
  }

  async getAdminDetail(id: number) {
    const item = await this.getReflectionById(BigInt(id));

    if (!item) {
      throw new NotFoundException("reflection_not_found");
    }

    return {
      success: true,
      message: "ok",
      data: this.mapAdminReflection(item),
    };
  }

  async updateReflection(id: number, dto: UpdateReflectionDto, adminUserId: number) {
    const reflectionId = BigInt(id);
    const existing = await this.prisma.reflection.findUnique({
      where: { id: reflectionId },
    });

    if (!existing) {
      throw new NotFoundException("reflection_not_found");
    }

    if (dto.display_status === "visible" && existing.auditStatus !== "approved") {
      throw new UnprocessableEntityException("cannot_show_unapproved_reflection");
    }

    const nextReflectionTypeId =
      dto.reflection_type_id !== undefined
        ? BigInt(dto.reflection_type_id)
        : existing.reflectionTypeId;
    const nextTeachingProjectId =
      dto.teaching_project_id !== undefined
        ? dto.teaching_project_id === null
          ? null
          : BigInt(dto.teaching_project_id)
        : existing.teachingProjectId;

    await this.validateAdminReflectionMeta(nextReflectionTypeId, nextTeachingProjectId);

    const updated = await this.prisma.reflection.update({
      where: { id: reflectionId },
      data: {
        ...(dto.submit_content !== undefined
          ? { submitContent: dto.submit_content.trim() }
          : {}),
        ...(dto.reflection_title !== undefined
          ? { reflectionTitle: dto.reflection_title.trim() || null }
          : {}),
        ...(dto.reflection_type_id !== undefined
          ? { reflectionTypeId: BigInt(dto.reflection_type_id) }
          : {}),
        ...(dto.teaching_project_id !== undefined
          ? {
              teachingProjectId:
                dto.teaching_project_id === null
                  ? null
                  : BigInt(dto.teaching_project_id),
            }
          : {}),
        ...(dto.display_status !== undefined
          ? { displayStatus: dto.display_status }
          : {}),
        ...(dto.is_featured !== undefined
          ? { isFeatured: dto.is_featured }
          : {}),
        ...(dto.is_top !== undefined ? { isTop: dto.is_top } : {}),
        ...(dto.is_anonymous !== undefined
          ? { isAnonymous: dto.is_anonymous }
          : {}),
        ...(dto.display_name !== undefined
          ? { displayName: dto.display_name || null }
          : {}),
        ...(dto.remarks !== undefined ? { remarks: dto.remarks || null } : {}),
      },
    });

    await this.createAuditLog(
      reflectionId,
      adminUserId,
      "update_reflection",
      JSON.stringify(dto),
    );

    return {
      success: true,
      message: "updated",
      data: {
        id,
        audit_status: updated.auditStatus,
        display_status: updated.displayStatus,
      },
    };
  }

  async approveReflection(id: number, dto: ApproveReflectionDto, adminUserId: number) {
    const reflectionId = BigInt(id);
    const reflection = await this.prisma.reflection.findUnique({
      where: { id: reflectionId },
    });

    if (!reflection) {
      throw new NotFoundException("reflection_not_found");
    }

    const displayStatus = dto.display_status ?? "visible";

    const updated = await this.prisma.reflection.update({
      where: { id: reflectionId },
      data: {
        auditStatus: "approved",
        displayStatus,
      },
    });

    await this.createAuditLog(
      reflectionId,
      adminUserId,
      "approve_reflection",
      `display_status=${displayStatus}`,
    );

    return {
      success: true,
      message: "approved",
      data: {
        id,
        audit_status: updated.auditStatus,
        display_status: updated.displayStatus,
      },
    };
  }

  async rejectReflection(id: number, dto: RejectReflectionDto, adminUserId: number) {
    const reflectionId = BigInt(id);
    const reflection = await this.prisma.reflection.findUnique({
      where: { id: reflectionId },
    });

    if (!reflection) {
      throw new NotFoundException("reflection_not_found");
    }

    const updated = await this.prisma.reflection.update({
      where: { id: reflectionId },
      data: {
        auditStatus: "rejected",
        displayStatus: "hidden",
        ...(dto.remarks !== undefined ? { remarks: dto.remarks || null } : {}),
      },
    });

    await this.createAuditLog(
      reflectionId,
      adminUserId,
      "reject_reflection",
      dto.remarks,
    );

    return {
      success: true,
      message: "rejected",
      data: {
        id,
        audit_status: updated.auditStatus,
        display_status: updated.displayStatus,
      },
    };
  }

  async setVisibility(id: number, dto: SetVisibilityDto, adminUserId: number) {
    const reflectionId = BigInt(id);
    const reflection = await this.prisma.reflection.findUnique({
      where: { id: reflectionId },
    });

    if (!reflection) {
      throw new NotFoundException("reflection_not_found");
    }

    if (dto.display_status === "visible" && reflection.auditStatus !== "approved") {
      throw new UnprocessableEntityException("cannot_show_unapproved_reflection");
    }

    const updated = await this.prisma.reflection.update({
      where: { id: reflectionId },
      data: {
        displayStatus: dto.display_status,
      },
    });

    await this.createAuditLog(
      reflectionId,
      adminUserId,
      "set_visibility",
      `display_status=${dto.display_status}`,
    );

    return {
      success: true,
      message: "visibility_updated",
      data: {
        id,
        display_status: updated.displayStatus,
      },
    };
  }

  async deleteReflection(id: number, _adminUserId: number) {
    const reflectionId = BigInt(id);
    const reflection = await this.prisma.reflection.findUnique({
      where: { id: reflectionId },
      select: {
        id: true,
      },
    });

    if (!reflection) {
      throw new NotFoundException("reflection_not_found");
    }

    await this.prisma.$transaction([
      this.prisma.reflectionLike.deleteMany({
        where: {
          reflectionId,
        },
      }),
      this.prisma.reflectionView.deleteMany({
        where: {
          reflectionId,
        },
      }),
      this.prisma.auditLog.deleteMany({
        where: {
          reflectionId,
        },
      }),
      this.prisma.reflection.delete({
        where: { id: reflectionId },
      }),
    ]);

    return {
      success: true,
      message: "deleted",
      data: {
        id,
      },
    };
  }

  async getOverviewStats() {
    const [
      totalCount,
      pendingCount,
      approvedCount,
      visibleCount,
      featuredCount,
      totalViewCount,
    ] =
      await this.prisma.$transaction([
        this.prisma.reflection.count(),
        this.prisma.reflection.count({
          where: { auditStatus: "pending" },
        }),
        this.prisma.reflection.count({
          where: { auditStatus: "approved" },
        }),
        this.prisma.reflection.count({
          where: { auditStatus: "approved", displayStatus: "visible" },
        }),
        this.prisma.reflection.count({
          where: { isFeatured: true },
        }),
        this.prisma.reflection.aggregate({
          _sum: { viewCount: true },
        }),
      ]);

    return {
      success: true,
      message: "ok",
      data: {
        total_count: totalCount,
        pending_count: pendingCount,
        approved_count: approvedCount,
        visible_count: visibleCount,
        featured_count: featuredCount,
        total_view_count: totalViewCount._sum.viewCount ?? 0,
      },
    };
  }

  async getPublicList(query: PublicListReflectionsDto, visitorId?: string) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 20;
    const where = this.buildPublicWhere(query);

    const [list, total] = await this.prisma.$transaction([
      this.prisma.reflection.findMany({
        where,
        include: {
          reflectionType: true,
          teachingProject: true,
        },
        orderBy: [{ isTop: "desc" }, { submitTime: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.reflection.count({ where }),
    ]);

    const likedIdSet = new Set<number>();
    if (visitorId && list.length > 0) {
      const likes = await this.prisma.reflectionLike.findMany({
        where: {
          visitorId,
          reflectionId: {
            in: list.map((item) => item.id),
          },
        },
        select: {
          reflectionId: true,
        },
      });

      likes.forEach((item) => {
        likedIdSet.add(Number(item.reflectionId));
      });
    }

    return {
      success: true,
      message: "ok",
      data: {
        list: list.map((item) => ({
          id: Number(item.id),
          display_name: item.isAnonymous
            ? item.displayName || "匿名同学"
            : item.displayName || item.studentName,
          reflection_title: item.reflectionTitle,
          submit_content: item.submitContent,
          submit_time: item.submitTime.toISOString(),
          source_group_name: item.sourceGroupName,
          reflection_type_name: item.reflectionType?.name ?? null,
          teaching_project_name: item.teachingProject?.name ?? null,
          is_featured: item.isFeatured,
          is_top: item.isTop,
          like_count: item.likeCount,
          view_count: item.viewCount,
          liked: likedIdSet.has(Number(item.id)),
        })),
        pagination: {
          page,
          page_size: pageSize,
          total,
        },
      },
    };
  }

  async getPublicSummary() {
    const setting = await this.ensurePublicDisplaySetting();
    const [visibleCount, featuredCount, totalLikes, totalViews] = await this.prisma.$transaction([
      this.prisma.reflection.count({
        where: { auditStatus: "approved", displayStatus: "visible" },
      }),
      this.prisma.reflection.count({
        where: { auditStatus: "approved", displayStatus: "visible", isFeatured: true },
      }),
      this.prisma.reflection.aggregate({
        _sum: { likeCount: true },
        where: { auditStatus: "approved", displayStatus: "visible" },
      }),
      this.prisma.reflection.aggregate({
        _sum: { viewCount: true },
        where: { auditStatus: "approved", displayStatus: "visible" },
      }),
    ]);

    return {
      success: true,
      message: "ok",
      data: {
        project_name: "教学反思墙",
        subtitle: "记录真实感受，沉淀每一次课堂中的成长",
        time_range: "本学期",
        organizer: "待配置",
        visible_count: visibleCount,
        featured_count: featuredCount,
        total_like_count: totalLikes._sum.likeCount ?? 0,
        total_view_count: totalViews._sum.viewCount ?? 0,
        show_view_count: setting.showViewCount,
      },
    };
  }

  async recordReflectionView(id: number, visitorId?: string) {
    const reflectionId = BigInt(id);
    const reflection = await this.prisma.reflection.findFirst({
      where: {
        id: reflectionId,
        auditStatus: "approved",
        displayStatus: "visible",
      },
      select: {
        id: true,
        viewCount: true,
      },
    });

    if (!reflection) {
      throw new NotFoundException("reflection_not_found");
    }

    const cutoff = new Date(
      Date.now() - this.reflectionViewDedupMinutes * 60 * 1000,
    );

    if (visitorId) {
      const recentView = await this.prisma.reflectionView.findFirst({
        where: {
          reflectionId,
          visitorId,
          createdAt: {
            gte: cutoff,
          },
        },
        select: { id: true },
      });

      if (recentView) {
        return {
          success: true,
          message: "ok",
          data: {
            id,
            view_count: reflection.viewCount,
            counted: false,
          },
        };
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (visitorId) {
        await tx.reflectionView.create({
          data: {
            reflectionId,
            visitorId,
          },
        });
      }

      return tx.reflection.update({
        where: { id: reflectionId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
        select: {
          viewCount: true,
        },
      });
    });

    return {
      success: true,
      message: "viewed",
      data: {
        id,
        view_count: updated.viewCount,
        counted: true,
      },
    };
  }

  async likeReflection(id: number, visitorId?: string) {
    if (!visitorId) {
      throw new BadRequestException("visitor_id_required");
    }

    const reflectionId = BigInt(id);
    const reflection = await this.prisma.reflection.findFirst({
      where: {
        id: reflectionId,
        auditStatus: "approved",
        displayStatus: "visible",
      },
    });

    if (!reflection) {
      throw new NotFoundException("reflection_not_found");
    }

    try {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.reflectionLike.create({
          data: {
            reflectionId,
            visitorId,
          },
        }),
        this.prisma.reflection.update({
          where: { id: reflectionId },
          data: {
            likeCount: { increment: 1 },
          },
        }),
      ]);

      return {
        success: true,
        message: "liked",
        data: {
          id,
          like_count: updated.likeCount,
          liked: true,
        },
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("already_liked");
      }

      throw error;
    }
  }

  async getLikeStatus(id: number, visitorId?: string) {
    if (!visitorId) {
      throw new BadRequestException("visitor_id_required");
    }

    const reflectionId = BigInt(id);
    const reflection = await this.prisma.reflection.findFirst({
      where: {
        id: reflectionId,
        auditStatus: "approved",
        displayStatus: "visible",
      },
      select: {
        id: true,
        likeCount: true,
      },
    });

    if (!reflection) {
      throw new NotFoundException("reflection_not_found");
    }

    const liked = await this.prisma.reflectionLike.findUnique({
      where: {
        reflectionId_visitorId: {
          reflectionId,
          visitorId,
        },
      },
      select: { id: true },
    });

    return {
      success: true,
      message: "ok",
      data: {
        id,
        liked: Boolean(liked),
        like_count: reflection.likeCount,
      },
    };
  }
}
