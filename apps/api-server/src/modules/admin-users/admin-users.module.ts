import { Module } from "@nestjs/common";
import { AdminBootstrapService } from "./admin-bootstrap.service";
import { AdminUsersService } from "./admin-users.service";

@Module({
  providers: [AdminUsersService, AdminBootstrapService],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
