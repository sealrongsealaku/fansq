import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { resolve } from "node:path";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AdminUsersModule } from "./modules/admin-users/admin-users.module";
import { ReflectionsModule } from "./modules/reflections/reflections.module";

const cwd = process.cwd();
const envFilePaths = [
  resolve(cwd, ".env.local"),
  resolve(cwd, ".env"),
  resolve(cwd, "../../.env.local"),
  resolve(cwd, "../../.env"),
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFilePaths,
    }),
    JwtModule.register({}),
    PrismaModule,
    AdminUsersModule,
    AuthModule,
    ReflectionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
