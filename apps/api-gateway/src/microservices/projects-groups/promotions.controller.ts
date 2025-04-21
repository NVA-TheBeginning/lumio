import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiCreatedResponse } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { PromotionsService } from "./promotions.service.js";

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  students_csv!: string;

  @IsNumber()
  creatorId!: number;
}

interface UpdatePromotionDto extends Record<string, unknown> {
  name?: string;
  description?: string;
  students_csv?: string;
}

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

interface Student {
  id: number;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
}

interface PromotionWithStudents {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
  students: Student[];
}

@Controller("promotions")
export class PromotionsController {
  constructor(
    private readonly proxy: MicroserviceProxyService,
    private readonly promotionsService: PromotionsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: CreatePromotionDto })
  async create(@Body() createPromotionDto: CreatePromotionDto) {
    return await this.promotionsService.create(createPromotionDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query("creatorId") creatorId?: string) {
    return this.proxy.forwardRequest("project", "/promotions", "GET", undefined, { creatorId });
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("project", `/promotions/${id}`, "GET");
  }

  @Get(":id/students")
  @HttpCode(HttpStatus.OK)
  async getPromotionStudents(@Param("id", ParseIntPipe) id: number): Promise<Student[]> {
    const promotion = await this.proxy.forwardRequest<Promotion>("project", `/promotions/${id}`, "GET");

    const studentIds = promotion.studentPromotions.map((sp) => sp.userId);

    if (studentIds.length === 0) {
      return [];
    }

    return await this.proxy.forwardRequest<Student[]>("auth", `/users?ids=${studentIds.join(",")}`, "GET");
  }

  @Patch(":id")

  @HttpCode(HttpStatus.OK)
  async update(@Param("id", ParseIntPipe) id: number, @Body() updatePromotionDto: UpdatePromotionDto) {
    return this.proxy.forwardRequest("project", `/promotions/${id}`, "PATCH", updatePromotionDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("project", `/promotions/${id}`, "DELETE");
  }

  @Delete(":id/student")
  @HttpCode(HttpStatus.OK)
  async removeStudentsFromPromotion(@Param("id", ParseIntPipe) promoId: number, @Body() studentIds: number[]) {
    return this.proxy.forwardRequest("project", `/promotions/${promoId}/student`, "DELETE", { studentIds });
  }

  @Get("with-students")
  @HttpCode(HttpStatus.OK)
  async findAllWithStudents(): Promise<PromotionWithStudents[]> {
    const promotions = await this.proxy.forwardRequest<Promotion[]>("project", "/promotions", "GET");

    const studentIds = [...new Set(promotions.flatMap((promo) => promo.studentPromotions.map((sp) => sp.userId)))];

    if (studentIds.length === 0) {
      return promotions.map((promo) => ({
        id: promo.id,
        name: promo.name,
        description: promo.description,
        creatorId: promo.creatorId,
        createdAt: promo.createdAt,
        updatedAt: promo.updatedAt,
        students: [],
      }));
    }

    const students = await this.proxy.forwardRequest<Student[]>("auth", `/users?ids=${studentIds.join(",")}`, "GET");

    const studentMap = new Map(students.map((student) => [student.id, student]));

    return promotions.map((promo) => ({
      id: promo.id,
      name: promo.name,
      description: promo.description,
      creatorId: promo.creatorId,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
      students: promo.studentPromotions
        .map((sp) => studentMap.get(sp.userId))
        .filter((student): student is Student => student !== undefined),
    }));
  }
}
