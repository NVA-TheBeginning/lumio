import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Put } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { UpdateFinalGradeDto } from "../dto/update-final-grade.dto.js";

@ApiTags("final-grades")
@Controller("projects/:projectPromotionId/final-grades")
export class FinalGradeController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister les notes finales" })
  @ApiParam({ name: "projectPromotionId", type: Number })
  @ApiResponse({ status: 200, description: "Notes finales retournées." })
  findAll(@Param("projectPromotionId", ParseIntPipe) projectPromotionId: number) {
    return this.proxy.forwardRequest("evaluation", `/projects/${projectPromotionId}/final-grades`, "GET");
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour les notes finales" })
  @ApiBody({ type: [UpdateFinalGradeDto] })
  @ApiResponse({ status: 200, description: "Notes finales mises à jour." })
  updateAll(
    @Param("projectPromotionId", ParseIntPipe) projectPromotionId: number,
    @Body() dtos: UpdateFinalGradeDto[],
  ) {
    return this.proxy.forwardRequest("evaluation", `/projects/${projectPromotionId}/final-grades`, "PUT", dtos);
  }
}
