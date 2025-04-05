import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Check API Gateway health" })
  check() {
    return {
      status: HttpStatus.OK,
      message: "OK",
    };
  }
}
