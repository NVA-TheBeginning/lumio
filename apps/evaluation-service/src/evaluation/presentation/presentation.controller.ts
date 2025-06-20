import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreatePresentationDto } from "./dto/create-presentation.dto";
import { UpdatePresentationDto } from "./dto/update-presentation.dto";
import { PresentationService } from "./presentation.service";

@ApiTags("presentations")
@Controller()
export class PresentationController {
  constructor(private readonly service: PresentationService) {}

  @Post("/presentations/:projectId/:promotionId")
  @ApiOperation({ summary: "Créer créneaux de soutenance" })
  @ApiResponse({ status: 201, description: "Créneaux de Soutenance créée." })
  create(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
    @Body() dto: CreatePresentationDto,
  ) {
    return this.service.create({ ...dto, projectId, promotionId });
  }

  @Get("/presentations/:projectId/:promotionId")
  @ApiOperation({ summary: "Lister toutes les soutenances" })
  findAll(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
  ) {
    return this.service.findAll(projectId, promotionId);
  }

  @Get("/presentations/:id")
  @ApiOperation({ summary: "Obtenir une soutenance par ID" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put("/presentations/:id")
  @ApiOperation({ summary: "Mettre à jour une soutenance" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePresentationDto) {
    return this.service.update(id, dto);
  }

  @Delete("/presentations/:id")
  @ApiOperation({ summary: "Supprimer une soutenance" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
