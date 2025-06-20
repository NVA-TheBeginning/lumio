import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreateGradeDto } from "../dto/create-grade.dto.js";
import { UpdateGradeDto } from "../dto/update-grade.dto.js";

@ApiTags("grades")
@Controller()
export class GradeController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("criteria/:criteriaId/grades")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer une note" })
  @ApiParam({ name: "criteriaId", type: Number })
  @ApiBody({ type: CreateGradeDto })
  @ApiResponse({ status: 201, description: "Note créée." })
  create(@Param("criteriaId", ParseIntPipe) criteriaId: number, @Body() dto: CreateGradeDto) {
    return this.proxy.forwardRequest("evaluation", `/criteria/${criteriaId}/grades`, "POST", dto);
  }

  @Get("criteria/:criteriaId/grades")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister les notes" })
  @ApiParam({ name: "criteriaId", type: Number })
  @ApiResponse({ status: 200, description: "Liste des notes." })
  findAll(@Param("criteriaId", ParseIntPipe) criteriaId: number) {
    return this.proxy.forwardRequest("evaluation", `/criteria/${criteriaId}/grades`, "GET");
  }

  @Get("grades/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Obtenir une note par ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Note retournée." })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/grades/${id}`, "GET");
  }

  @Put("grades/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour une note" })
  @ApiBody({ type: UpdateGradeDto })
  @ApiResponse({ status: 200, description: "Note mise à jour." })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateGradeDto) {
    return this.proxy.forwardRequest("evaluation", `/grades/${id}`, "PUT", dto);
  }

  @Delete("grades/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Supprimer une note" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Note supprimée." })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/grades/${id}`, "DELETE");
  }
}
