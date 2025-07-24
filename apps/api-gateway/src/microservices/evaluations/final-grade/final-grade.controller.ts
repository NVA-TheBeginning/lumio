import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GetUser, JwtUser } from "@/common/decorators/get-user.decorator.js";
import { AuthGuard } from "@/jwt/guards/auth.guard.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { UpdateFinalGradeDto } from "../dto/update-final-grade.dto.js";

@ApiTags("final-grades")
@Controller()
export class FinalGradeController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Get("projects/:projectId/promotions/:promotionId/final-grades")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister les notes finales pour un projet et une promotion" })
  @ApiParam({ name: "projectId", type: Number, description: "ID du projet" })
  @ApiParam({ name: "promotionId", type: Number, description: "ID de la promotion" })
  @ApiResponse({ status: 200, description: "Liste des notes finales." })
  @ApiResponse({ status: 404, description: "Projet ou promotion introuvable." })
  findAll(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
  ) {
    return this.proxy.forwardRequest(
      "evaluation",
      `/projects/${projectId}/promotions/${promotionId}/final-grades`,
      "GET",
    );
  }

  @Get("students/me/projects/:projectId/evaluations")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: "Récupérer toutes les évaluations de l'étudiant connecté pour un projet" })
  @ApiParam({ name: "projectId", type: Number, description: "ID du projet" })
  @ApiResponse({
    status: 200,
    description: "Évaluations complètes de l'étudiant (notes finales + critères avec notes).",
  })
  @ApiResponse({ status: 404, description: "Projet introuvable ou étudiant non trouvé." })
  findStudentEvaluations(@Param("projectId", ParseIntPipe) projectId: number, @GetUser() user: JwtUser) {
    return this.proxy.forwardRequest("evaluation", `/students/${user.sub}/projects/${projectId}/evaluations`, "GET");
  }

  @Post("projects/:projectId/promotions/:promotionId/final-grades")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Calculer et sauvegarder les notes finales" })
  @ApiParam({ name: "projectId", type: Number, description: "ID du projet" })
  @ApiParam({ name: "promotionId", type: Number, description: "ID de la promotion" })
  @ApiResponse({ status: 201, description: "Notes finales calculées et sauvegardées." })
  @ApiResponse({ status: 400, description: "Calcul impossible (critères manquants)." })
  @ApiResponse({ status: 404, description: "Projet ou promotion introuvable." })
  calculateAndSave(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
  ) {
    return this.proxy.forwardRequest(
      "evaluation",
      `/projects/${projectId}/promotions/${promotionId}/final-grades`,
      "POST",
      {},
    );
  }

  @Put("final-grades/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour une note finale manuellement" })
  @ApiParam({ name: "id", type: Number, description: "ID de la note finale" })
  @ApiBody({ type: UpdateFinalGradeDto })
  @ApiResponse({ status: 200, description: "Note finale mise à jour." })
  @ApiResponse({ status: 400, description: "Données invalides." })
  @ApiResponse({ status: 404, description: "Note finale introuvable." })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateFinalGradeDto) {
    return this.proxy.forwardRequest("evaluation", `/final-grades/${id}`, "PUT", dto);
  }

  @Get("final-grades/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Obtenir une note finale par ID" })
  @ApiParam({ name: "id", type: Number, description: "ID de la note finale" })
  @ApiResponse({ status: 200, description: "Note finale retournée." })
  @ApiResponse({ status: 404, description: "Note finale introuvable." })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/final-grades/${id}`, "GET");
  }
}
