import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CriteriaService } from "./criteria.service";
import { CreateCriteriaDto } from "./dto/create-criteria.dto";
import { UpdateCriteriaDto } from "./dto/update-criteria.dto";

@ApiTags("criteria")
@Controller()
export class CriteriaController {
  constructor(private readonly service: CriteriaService) {}

  @Post("projects/:projectId/promotions/:promotionId/criteria")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer un critère de notation" })
  @ApiParam({ name: "projectId", type: Number, description: "ID du projet" })
  @ApiParam({ name: "promotionId", type: Number, description: "ID de la promotion" })
  @ApiBody({ type: CreateCriteriaDto })
  @ApiResponse({ status: 201, description: "Critère créé avec succès." })
  @ApiResponse({ status: 400, description: "Données invalides." })
  @ApiResponse({ status: 404, description: "Projet ou promotion introuvable." })
  create(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
    @Body() dto: CreateCriteriaDto,
  ) {
    return this.service.create(projectId, promotionId, dto);
  }

  @Get("projects/:projectId/promotions/:promotionId/criteria")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister les critères de notation pour un projet et une promotion" })
  @ApiParam({ name: "projectId", type: Number, description: "ID du projet" })
  @ApiParam({ name: "promotionId", type: Number, description: "ID de la promotion" })
  @ApiResponse({ status: 200, description: "Liste des critères de notation." })
  @ApiResponse({ status: 404, description: "Projet ou promotion introuvable." })
  findAll(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
  ) {
    return this.service.findAll(projectId, promotionId);
  }

  @Put("criteria/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour un critère de notation" })
  @ApiParam({ name: "id", type: Number, description: "ID du critère" })
  @ApiBody({ type: UpdateCriteriaDto })
  @ApiResponse({ status: 200, description: "Critère mis à jour avec succès." })
  @ApiResponse({ status: 400, description: "Données invalides." })
  @ApiResponse({ status: 404, description: "Critère introuvable." })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateCriteriaDto) {
    return this.service.update(id, dto);
  }

  @Delete("criteria/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Supprimer un critère de notation" })
  @ApiParam({ name: "id", type: Number, description: "ID du critère" })
  @ApiResponse({ status: 200, description: "Critère supprimé avec succès." })
  @ApiResponse({ status: 404, description: "Critère introuvable." })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
