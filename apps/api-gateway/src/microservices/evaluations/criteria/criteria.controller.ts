import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreateCriteriaDto } from "../dto/create-criteria.dto.js";
import { UpdateCriteriaDto } from "../dto/update-criteria.dto.js";

@ApiTags("criteria")
@Controller()
export class CriteriaController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("projects/:projectId/promotions/:promotionId/criteria")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer un critère de notation" })
  @ApiParam({ name: "projectId", type: Number })
  @ApiParam({ name: "promotionId", type: Number })
  @ApiBody({ type: CreateCriteriaDto })
  @ApiResponse({ status: 201, description: "Critère créé." })
  create(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
    @Body() dto: CreateCriteriaDto,
  ) {
    return this.proxy.forwardRequest(
      "evaluation",
      `/projects/${projectId}/promotions/${promotionId}/criteria`,
      "POST",
      dto,
    );
  }

  @Get("projects/:projectId/promotions/:promotionId/criteria")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister les critères de notation" })
  @ApiParam({ name: "projectId", type: Number })
  @ApiParam({ name: "promotionId", type: Number })
  @ApiResponse({ status: 200, description: "Liste des critères." })
  findAll(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
  ) {
    return this.proxy.forwardRequest("evaluation", `/projects/${projectId}/promotions/${promotionId}/criteria`, "GET");
  }

  @Put("criteria/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour un critère de notation" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: UpdateCriteriaDto })
  @ApiResponse({ status: 200, description: "Critère mis à jour." })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCriteriaDto) {
    return this.proxy.forwardRequest("evaluation", `/criteria/${id}`, "PUT", dto);
  }

  @Delete("criteria/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Supprimer un critère de notation" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Critère supprimé." })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/criteria/${id}`, "DELETE");
  }
}
