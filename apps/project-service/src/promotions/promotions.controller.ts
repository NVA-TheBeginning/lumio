import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CreatePromotionDto } from "./dto/create-promotion.dto";
import { UpdatePromotionDto } from "./dto/update-promotion.dto";
import { PromotionEntity } from "./entities/promotion.entity";
import { PromotionsService } from "./promotions.service";

@ApiTags("promotions")
@Controller("promotions")
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @ApiCreatedResponse({ type: PromotionEntity })
  async create(@Body() createPromotionDto: CreatePromotionDto) {
    const promo = await this.promotionsService.create(createPromotionDto);
    return new PromotionEntity(promo);
  }

  @Post(":idPromotion/student")
  async addStudentsToPromotion(@Param("idPromotion", ParseIntPipe) promoId: number, @Body() studentIds: number[]) {
    const promo = await this.promotionsService.addStudents(promoId, studentIds);
    return new PromotionEntity(promo);
  }

  @Get()
  @ApiOkResponse({ type: PromotionEntity, isArray: true })
  async findAll(@Query("creatorId") creatorId?: string) {
    const creatorIdNumber = creatorId ? Number.parseInt(creatorId, 10) : undefined;
    const promos = await this.promotionsService.findAll(creatorIdNumber);
    return promos.map((promo) => new PromotionEntity(promo));
  }

  @Get(":id")
  @ApiOkResponse({ type: PromotionEntity })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const promo = await this.promotionsService.findOne(id);
    return new PromotionEntity(promo);
  }

  @Get("student/:studentId")
  @ApiOkResponse({ type: PromotionEntity, isArray: true })
  @ApiOperation({ summary: "Get all promotions for a given student" })
  @ApiParam({ name: "studentId", type: Number, description: "ID of the student" })
  async findByStudent(@Param("studentId", ParseIntPipe) studentId: number) {
    const promos = await this.promotionsService.findByStudent(studentId);
    return promos.map((p) => new PromotionEntity(p));
  }

  @Patch(":id")
  @ApiCreatedResponse({ type: PromotionEntity })
  async update(@Param("id", ParseIntPipe) id: number, @Body() updatePromotionDto: UpdatePromotionDto) {
    const promo = await this.promotionsService.update(id, updatePromotionDto);
    return new PromotionEntity(promo);
  }

  @Delete(":id")
  @ApiOkResponse({ type: PromotionEntity })
  async remove(@Param("id", ParseIntPipe) id: number) {
    await this.promotionsService.remove(id);
    return { message: "Promotion deleted successfully" };
  }

  @Delete(":id/student")
  @ApiOkResponse({ type: PromotionEntity })
  async removeStudentsFromPromotion(@Param("id", ParseIntPipe) promoId: number, @Body() studentIds: number[]) {
    await this.promotionsService.removeStudents(promoId, studentIds);
    return { message: `Students removed from promotion ${promoId} successfully` };
  }
}
