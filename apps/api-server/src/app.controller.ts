import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("health")
  getHealth() {
    return {
      success: true,
      message: "ok",
      data: {
        service: "api-server",
        status: "ok",
        timestamp: new Date().toISOString(),
      },
    };
  }
}

