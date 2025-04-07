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

@Controller("projects")
export class ProjectsController {
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
}
