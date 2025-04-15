import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

interface CreatePromotionDto extends Record<string, unknown> {
  name: string;
  description: string;
  students_csv: string;
  creatorId: number;
}

interface UpdatePromotionDto extends Record<string, unknown> {
  name?: string;
  description?: string;
  students_csv?: string;
}

interface StudentPromotion {
  studentId: number;
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
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.proxy.forwardRequest("project", "/promotions", "POST", createPromotionDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll() {
    return this.proxy.forwardRequest("project", "/promotions", "GET");
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("project", `/promotions/${id}`, "GET");
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
    // First get all promotions
    const promotions = await this.proxy.forwardRequest<Promotion[]>("project", "/promotions", "GET");
    
    // Get all unique student IDs from all promotions
    const studentIds = [...new Set(promotions.flatMap(promo => 
      promo.studentPromotions.map(sp => sp.studentId)
    ))];
    
    // If there are no students, return promotions with empty student arrays
    if (studentIds.length === 0) {
      return promotions.map(promo => ({
        id: promo.id,
        name: promo.name,
        description: promo.description,
        creatorId: promo.creatorId,
        createdAt: promo.createdAt,
        updatedAt: promo.updatedAt,
        students: []
      }));
    }
    
    // Get all students in one request
    const students = await this.proxy.forwardRequest<Student[]>("auth", `/users?ids=${studentIds.join(',')}`, "GET");
    
    // Create a map of student ID to student data for quick lookup
    const studentMap = new Map(students.map(student => [student.id, student]));
    
    // Combine promotions with their students
    return promotions.map(promo => ({
      id: promo.id,
      name: promo.name,
      description: promo.description,
      creatorId: promo.creatorId,
      createdAt: promo.createdAt,
      updatedAt: promo.updatedAt,
      students: promo.studentPromotions
        .map(sp => studentMap.get(sp.studentId))
        .filter((student): student is Student => student !== undefined)
    }));
  }
}
