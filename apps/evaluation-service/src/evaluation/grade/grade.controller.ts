import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateGradeDto } from "./dto/create-grade.dto";
import { UpdateGradeDto } from "./dto/update-grade.dto";
import { GradeService } from "./grade.service";

@ApiTags("grades")
@Controller()
export class GradeController {
  constructor(private readonly service: GradeService) {}

  @Post("criteria/:criteriaId/grades")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer une note pour un critère" })
  @ApiParam({ name: "criteriaId", type: Number, description: "ID du critère de notation" })
  @ApiBody({ type: CreateGradeDto })
  @ApiResponse({ status: 201, description: "Note créée avec succès." })
  @ApiResponse({ status: 400, description: "Données invalides." })
  @ApiResponse({ status: 404, description: "Critère introuvable." })
  create(@Param("criteriaId", ParseIntPipe) criteriaId: number, @Body() dto: CreateGradeDto) {
    return this.service.create(criteriaId, dto);
  }

  @Get("criteria/:criteriaId/grades")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister toutes les notes pour un critère donné" })
  @ApiParam({ name: "criteriaId", type: Number, description: "ID du critère de notation" })
  @ApiResponse({ status: 200, description: "Liste des notes pour le critère." })
  @ApiResponse({ status: 404, description: "Critère introuvable." })
  findAll(@Param("criteriaId", ParseIntPipe) criteriaId: number) {
    return this.service.findAll(criteriaId);
  }

  @Get("grades/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Obtenir une note spécifique par son ID" })
  @ApiParam({ name: "id", type: Number, description: "ID de la note" })
  @ApiResponse({ status: 200, description: "Note retournée avec succès." })
  @ApiResponse({ status: 404, description: "Note introuvable." })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put("grades/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour une note existante" })
  @ApiParam({ name: "id", type: Number, description: "ID de la note" })
  @ApiBody({ type: UpdateGradeDto })
  @ApiResponse({ status: 200, description: "Note mise à jour avec succès." })
  @ApiResponse({ status: 400, description: "Données invalides." })
  @ApiResponse({ status: 404, description: "Note introuvable." })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateGradeDto) {
    return this.service.update(id, dto);
  }

  @Delete("grades/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Supprimer une note" })
  @ApiParam({ name: "id", type: Number, description: "ID de la note" })
  @ApiResponse({ status: 200, description: "Note supprimée avec succès." })
  @ApiResponse({ status: 404, description: "Note introuvable." })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
