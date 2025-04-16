import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiTags,
} from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

export class CreatePromotionDto {
  @ApiProperty({ example: "Promo Spring 2025" })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: "Promotion pour le semestre de printemps" })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({
    example: "Doe,John,john.doe@example.com\nSmith,Jane,jane.smith@example.com",
  })
  @IsNotEmpty()
  students_csv!: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  creatorId!: number;
}

export class UpdatePromotionDto {
  @ApiProperty({ required: false, example: "Nouvelle promo 2025" })
  @IsString()
  name?: string;

  @ApiProperty({
    required: false,
    example: "Mise à jour de la description",
  })
  @IsString()
  description?: string;

  @ApiProperty({
    required: false,
    example: "Doe,John,john.doe@example.com\nSmith,Jane,jane.smith@example.com",
  })
  students_csv?: string;
}

@ApiTags("promotions")
@Controller("promotions")
export class PromotionsController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new promotion" })
  @ApiBody({ type: CreatePromotionDto })
  @ApiCreatedResponse({
    description: "The promotion has been successfully created",
    type: Object,
  })
  async create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.proxy.forwardRequest("project", "/promotions", "POST", createPromotionDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retrieve all promotions" })
  @ApiOkResponse({
    description: "List of promotions",
    type: [Object],
  })
  async findAll() {
    return this.proxy.forwardRequest("project", "/promotions", "GET");
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retrieve a promotion by ID" })
  @ApiParam({ name: "id", type: Number, description: "Promotion ID" })
  @ApiOkResponse({
    description: "The promotion details",
    type: Object,
  })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("project", `/promotions/${id}`, "GET");
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update a promotion by ID" })
  @ApiParam({ name: "id", type: Number, description: "Promotion ID" })
  @ApiBody({ type: UpdatePromotionDto })
  @ApiOkResponse({
    description: "The updated promotion",
    type: Object,
  })
  async update(@Param("id", ParseIntPipe) id: number, @Body() updatePromotionDto: UpdatePromotionDto) {
    return this.proxy.forwardRequest("project", `/promotions/${id}`, "PATCH", updatePromotionDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a promotion by ID" })
  @ApiParam({ name: "id", type: Number, description: "Promotion ID" })
  @ApiOkResponse({ description: "Promotion successfully deleted" })
  async remove(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("project", `/promotions/${id}`, "DELETE");
  }

  @Delete(":id/student")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Remove one or more students from a promotion (by student IDs)",
  })
  @ApiParam({ name: "id", type: Number, description: "Promotion ID" })
  @ApiBody({
    schema: {
      type: "array",
      items: { type: "number" },
      example: [1, 2, 3],
      description: "Array of student IDs to remove",
    },
  })
  @ApiOkResponse({
    description: "Students successfully removed from the promotion",
  })
  async removeStudentsFromPromotion(@Param("id", ParseIntPipe) promoId: number, @Body() studentIds: number[]) {
    return this.proxy.forwardRequest("project", `/promotions/${promoId}/student`, "DELETE", { studentIds });
  }
}
