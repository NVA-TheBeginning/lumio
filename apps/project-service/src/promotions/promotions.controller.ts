import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
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

  @Get()
  @ApiOkResponse({ type: PromotionEntity, isArray: true })
  async findAll() {
    const promos = await this.promotionsService.findAll();
    return promos.map((promo) => new PromotionEntity(promo));
  }

  @Get(":id")
  @ApiOkResponse({ type: PromotionEntity })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const promo = await this.promotionsService.findOne(id);
    return new PromotionEntity(promo);
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
    const promo = await this.promotionsService.remove(id);
    return new PromotionEntity(promo);
  }
}
