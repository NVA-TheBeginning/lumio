import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import {
  CreatePromotionDto,
  CreateStudentDto,
  PromotionWithStudentsDto,
  StudentDto,
  UpdatePromotionDto,
} from "../dto/promotions.dto.js";
import { PromotionsService } from "./promotions.service.js";

interface StudentPromotion {
  userId: number;
}

interface Promotion {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  studentPromotions: StudentPromotion[];
}

@ApiTags("promotions")
@Controller("promotions")
export class PromotionsController {
  constructor(
    private readonly proxy: MicroserviceProxyService,
    private readonly promotionsService: PromotionsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer une nouvelle promotion" })
  @ApiBody({ type: CreatePromotionDto })
  @ApiCreatedResponse({ type: CreatePromotionDto, description: "Promotion créée" })
  async create(@Body() createPromotionDto: CreatePromotionDto): Promise<unknown> {
    return this.promotionsService.create(createPromotionDto);
  }

  @Post(":idPromotion/student")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Ajouter des étudiants à une promotion existante" })
  @ApiParam({ name: "idPromotion", type: Number, description: "ID de la promotion" })
  @ApiBody({ type: [CreateStudentDto] })
  @ApiCreatedResponse({ description: "Étudiants ajoutés" })
  async addStudentsToPromotion(
    @Param("idPromotion", ParseIntPipe) promoId: number,
    @Body() createStudentDtos: CreateStudentDto[],
  ): Promise<unknown> {
    return this.promotionsService.addStudentsToPromotion(createStudentDtos, promoId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister toutes les promotions (optionnellement par créateur)" })
  @ApiQuery({ name: "creatorId", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Liste des promotions", type: [PromotionWithStudentsDto] })
  async findAll(@Query("creatorId") creatorId?: string): Promise<unknown> {
    return this.proxy.forwardRequest("project", "/promotions", "GET", undefined, { creatorId });
  }

  @Get("student/:studentId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Récupérer les promotions pour un étudiant" })
  @ApiParam({ name: "studentId", type: Number, description: "ID de l’étudiant" })
  @ApiResponse({ status: 200, description: "Promotions associées", type: [PromotionWithStudentsDto] })
  async findByStudent(@Param("studentId", ParseIntPipe) studentId: number): Promise<unknown> {
    return this.proxy.forwardRequest<unknown[]>("project", `/promotions/student/${studentId}`, "GET");
  }

  @Get(":id/students")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Récupérer les étudiants d'une promotion" })
  @ApiParam({ name: "id", type: Number, description: "ID de la promotion" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "size", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Étudiants de la promotion", type: [StudentDto] })
  async getPromotionStudents(
    @Param("id", ParseIntPipe) id: number,
    @Query("page") page?: number,
    @Query("size") size?: number,
    @Query("all", ParseBoolPipe) all?: boolean,
  ): Promise<{ data: StudentDto[] }> {
    const promotion = await this.proxy.forwardRequest<Promotion>("project", `/promotions/${id}`, "GET");

    const studentIds = promotion.studentPromotions.map((sp) => sp.userId);
    if (!studentIds.length) return { data: [] };

    return this.proxy.forwardRequest<{ data: StudentDto[] }>(
      "auth",
      `/users?ids=${studentIds.join(",")}`,
      "GET",
      undefined,
      {
        page,
        size,
        all,
      },
    );
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour une promotion" })
  @ApiParam({ name: "id", type: Number, description: "ID de la promotion" })
  @ApiBody({ type: UpdatePromotionDto })
  @ApiResponse({ status: 200, description: "Promotion mise à jour" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ): Promise<unknown> {
    return this.proxy.forwardRequest("project", `/promotions/${id}`, "PATCH", updatePromotionDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Supprimer une promotion" })
  @ApiParam({ name: "id", type: Number, description: "ID de la promotion" })
  @ApiResponse({ status: 200, description: "Promotion supprimée" })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<unknown> {
    return this.proxy.forwardRequest("project", `/promotions/${id}`, "DELETE");
  }

  @Delete(":id/student")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retirer des étudiants d’une promotion" })
  @ApiParam({ name: "id", type: Number, description: "ID de la promotion" })
  @ApiBody({ type: [Number], description: "Liste des IDs étudiants" })
  @ApiResponse({ status: 200, description: "Étudiants retirés" })
  async removeStudentsFromPromotion(
    @Param("id", ParseIntPipe) promoId: number,
    @Body() studentIds: number[],
  ): Promise<unknown> {
    return this.proxy.forwardRequest("project", `/promotions/${promoId}/student`, "DELETE", { studentIds });
  }

  @Get("with-students")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister toutes les promotions avec leurs étudiants" })
  @ApiResponse({ status: 200, description: "Promotions avec étudiants", type: [PromotionWithStudentsDto] })
  async findAllWithStudents(): Promise<PromotionWithStudentsDto[]> {
    return this.promotionsService.findAllWithStudents();
  }
}
