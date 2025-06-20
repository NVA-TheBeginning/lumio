import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateGradeDto } from "./dto/create-grade.dto";
import { UpdateGradeDto } from "./dto/update-grade.dto";
import { GradeService } from "./grade.service";

@ApiTags("grades")
@Controller()
export class GradeController {
  constructor(private readonly service: GradeService) {}

  @Post("criteria/:criteriaId/grades")
  @ApiOperation({ summary: "Créer une note" })
  @ApiResponse({ status: 201, description: "Note créée." })
  create(@Param("criteriaId", ParseIntPipe) criteriaId: number, @Body() dto: CreateGradeDto) {
    return this.service.create(criteriaId, dto);
  }

  @Get("criteria/:criteriaId/grades")
  @ApiOperation({ summary: "Lister les notes pour un critère" })
  findAll(@Param("criteriaId", ParseIntPipe) criteriaId: number) {
    return this.service.findAll(criteriaId);
  }

  @Get("grades/:id")
  @ApiOperation({ summary: "Obtenir une note par ID" })
  @ApiResponse({ status: 200, description: "Note retournée." })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put("grades/:id")
  @ApiOperation({ summary: "Mettre à jour une note" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateGradeDto) {
    return this.service.update(id, dto);
  }

  @Delete("grades/:id")
  @ApiOperation({ summary: "Supprimer une note" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
