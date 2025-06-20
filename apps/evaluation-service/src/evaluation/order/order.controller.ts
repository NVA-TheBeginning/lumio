import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { OrderService } from "./order.service";

@ApiTags("orders")
@Controller()
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post("presentations/:presentationId/orders")
  @ApiOperation({ summary: "Créer un ordre de passage" })
  @ApiResponse({ status: 201, description: "Ordre créé." })
  create(@Param("presentationId", ParseIntPipe) presentationId: number, @Body() dto: CreateOrderDto) {
    return this.service.create(presentationId, dto);
  }

  @Get("presentations/:presentationId/orders")
  @ApiOperation({ summary: "Lister les ordres pour une soutenance" })
  findAll(@Param("presentationId", ParseIntPipe) presentationId: number) {
    return this.service.findAll(presentationId);
  }

  @Put("orders/:id")
  @ApiOperation({ summary: "Mettre à jour un ordre" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.service.update(id, dto);
  }

  @Delete("orders/:id")
  @ApiOperation({ summary: "Supprimer un ordre" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
