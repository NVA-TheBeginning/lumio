import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreatePresentationDto } from "../dto/create-presentation.dto.js";
import { UpdatePresentationDto } from "../dto/update-presentation.dto.js";

@ApiTags("presentations")
@Controller()
export class PresentationController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("/presentations/:projectId/:promotionId")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer une soutenance" })
  @ApiParam({ name: "projectId", type: Number })
  @ApiParam({ name: "promotionId", type: Number })
  @ApiBody({ type: CreatePresentationDto })
  @ApiResponse({ status: 201, description: "Soutenance créée." })
  create(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
    @Body() dto: CreatePresentationDto,
  ) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${projectId}/${promotionId}`, "POST", dto);
  }

  @Get("/presentations/:projectId/:promotionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister toutes les soutenances" })
  @ApiParam({ name: "projectId", type: Number })
  @ApiParam({ name: "promotionId", type: Number })
  @ApiResponse({ status: 200, description: "Liste des soutenances." })
  findAll(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
  ) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${projectId}/${promotionId}`, "GET");
  }

  @Get("/presentations/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Obtenir une soutenance par ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Soutenance trouvée." })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${id}`, "GET");
  }

  @Put("/presentations/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour une soutenance" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: UpdatePresentationDto })
  @ApiResponse({ status: 200, description: "Soutenance mise à jour." })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePresentationDto) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${id}`, "PUT", dto);
  }

  @Delete("/presentations/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Supprimer une soutenance" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Soutenance supprimée." })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${id}`, "DELETE");
  }
}
