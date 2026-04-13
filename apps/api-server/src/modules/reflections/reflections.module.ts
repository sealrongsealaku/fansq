import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AdminStatsController } from "./admin-stats.controller";
import { InternalTokenGuard } from "../../common/guards/internal-token.guard";
import { ReflectionsAdminController } from "./reflections.admin.controller";
import { PublicSummaryController } from "./public-summary.controller";
import { ReflectionsInternalController } from "./reflections.internal.controller";
import { ReflectionsPublicController } from "./reflections.public.controller";
import { ReflectionMetaBootstrapService } from "./reflection-meta-bootstrap.service";
import { ReflectionsService } from "./reflections.service";

@Module({
  imports: [JwtModule.register({})],
  controllers: [
    AdminStatsController,
    ReflectionsAdminController,
    ReflectionsInternalController,
    ReflectionsPublicController,
    PublicSummaryController,
  ],
  providers: [ReflectionsService, ReflectionMetaBootstrapService, InternalTokenGuard],
  exports: [ReflectionsService],
})
export class ReflectionsModule {}
