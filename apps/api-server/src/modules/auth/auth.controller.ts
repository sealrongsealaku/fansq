import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AdminJwtPayload } from "./interfaces/admin-jwt-payload.interface";

@Controller("admin")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AdminJwtPayload) {
    return this.authService.getCurrentUser(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  logout() {
    return this.authService.logout();
  }
}

