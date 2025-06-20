import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreatePresentationDto } from "../dto/create-presentation.dto.js";
import { UpdatePresentationDto } from "../dto/update-presentation.dto.js";

@ApiTags("presentations")
@Controller("projects/:projectPromotionId/presentations")
export class PresentationController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer une soutenance" })
  @ApiParam({ name: "projectPromotionId", type: Number })
  @ApiBody({ type: CreatePresentationDto })
  @ApiResponse({ status: 201, description: "Soutenance créée." })
  create(@Param("projectPromotionId", ParseIntPipe) projectPromotionId: number, @Body() dto: CreatePresentationDto) {
    return this.proxy.forwardRequest("evaluation", `/projects/${projectPromotionId}/presentations`, "POST", dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister toutes les soutenances" })
  @ApiParam({ name: "projectPromotionId", type: Number })
  @ApiResponse({ status: 200, description: "Liste des soutenances." })
  findAll(@Param("projectPromotionId", ParseIntPipe) projectPromotionId: number) {
    return this.proxy.forwardRequest("evaluation", `/projects/${projectPromotionId}/presentations`, "GET");
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Obtenir une soutenance par ID" })
  @ApiParam({ name: "projectPromotionId", type: Number })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Soutenance trouvée." })
  findOne(
    @Param("projectPromotionId", ParseIntPipe) projectPromotionId: number,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.proxy.forwardRequest("evaluation", `/projects/${projectPromotionId}/presentations/${id}`, "GET");
  }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour une soutenance" })
  @ApiParam({ name: "projectPromotionId", type: Number })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: UpdatePresentationDto })
  @ApiResponse({ status: 200, description: "Soutenance mise à jour." })
  update(
    @Param("projectPromotionId", ParseIntPipe) projectPromotionId: number,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePresentationDto,
  ) {
    return this.proxy.forwardRequest("evaluation", `/projects/${projectPromotionId}/presentations/${id}`, "PUT", dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Supprimer une soutenance" })
  @ApiParam({ name: "projectPromotionId", type: Number })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Soutenance supprimée." })
  remove(@Param("projectPromotionId", ParseIntPipe) projectPromotionId: number, @Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/projects/${projectPromotionId}/presentations/${id}`, "DELETE");
  }
}
