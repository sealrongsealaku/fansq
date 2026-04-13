import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcryptjs";
import { AdminUsersService } from "../admin-users/admin-users.service";
import { LoginDto } from "./dto/login.dto";
import { AdminJwtPayload } from "./interfaces/admin-jwt-payload.interface";

@Injectable()
export class AuthService {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.adminUsersService.findByUsername(dto.username);
    if (!user) {
      throw new UnauthorizedException("invalid_credentials");
    }

    const passwordMatched = await compare(dto.password, user.passwordHash);
    if (!passwordMatched) {
      throw new UnauthorizedException("invalid_credentials");
    }

    const payload: AdminJwtPayload = {
      sub: Number(user.id),
      username: user.username,
      role: user.role,
    };

    const secret = this.configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new UnauthorizedException("jwt_secret_missing");
    }

    const accessToken = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn: "2h",
    });

    return {
      success: true,
      message: "ok",
      data: {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 7200,
        user: {
          id: Number(user.id),
          username: user.username,
          role: user.role,
        },
      },
    };
  }

  getCurrentUser(user: AdminJwtPayload) {
    return {
      success: true,
      message: "ok",
      data: {
        id: user.sub,
        username: user.username,
        role: user.role,
      },
    };
  }

  logout() {
    return {
      success: true,
      message: "logged_out",
      data: null,
    };
  }
}

