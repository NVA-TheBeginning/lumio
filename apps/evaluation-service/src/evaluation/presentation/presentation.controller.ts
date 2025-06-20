import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreatePresentationDto } from "./dto/create-presentation.dto";
import { UpdatePresentationDto } from "./dto/update-presentation.dto";
import { PresentationService } from "./presentation.service";

@ApiTags("presentations")
@Controller("projects/:projectPromotionId/presentations")
export class PresentationController {
  constructor(private readonly service: PresentationService) {}

  @Post()
  @ApiOperation({ summary: "Créer créneaux de soutenance" })
  @ApiResponse({ status: 201, description: "Créneaux de Soutenance créée." })
  create(@Param("projectPromotionId", ParseIntPipe) projectPromotionId: number, @Body() dto: CreatePresentationDto) {
    return this.service.create({ ...dto, projectPromotionId });
  }

  @Get()
  @ApiOperation({ summary: "Lister toutes les soutenances" })
  findAll(@Param("projectPromotionId", ParseIntPipe) projectPromotionId: number) {
    return this.service.findAll(projectPromotionId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtenir une soutenance par ID" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Mettre à jour une soutenance" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePresentationDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Supprimer une soutenance" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
