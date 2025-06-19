import { Controller, Get, HttpStatus, Module } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Check API auth service health" })
  check(): { status: HttpStatus; message: string } {
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
