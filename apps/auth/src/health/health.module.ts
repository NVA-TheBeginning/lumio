import { Controller, Get, HttpStatus, Module } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  check() {
    return {
      status: HttpStatus.OK,
      message: "OK",
    };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
