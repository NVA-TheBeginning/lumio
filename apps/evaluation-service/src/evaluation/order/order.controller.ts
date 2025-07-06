import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CreateOrderDto } from "./dto/create-order.dto";
import { GenerateOrdersDto } from "./dto/generate-orders.dto";
import { ReorderDto } from "./dto/reorder-orders.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { OrderService } from "./order.service";

@ApiTags("orders")
@Controller()
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post("presentations/:presentationId/orders/generate")
  @ApiParam({ name: "presentationId", type: Number })
  @ApiOperation({ summary: "Écriture du planning (groupIds déjà fournis)" })
  generate(@Param("presentationId", ParseIntPipe) presentationId: number, @Body() dto: GenerateOrdersDto) {
    return this.service.generate(presentationId, dto);
  }

  @Post("presentations/:presentationId/orders")
  create(@Param("presentationId", ParseIntPipe) presentationId: number, @Body() dto: CreateOrderDto) {
    return this.service.create(presentationId, dto);
  }

  @Get("presentations/:presentationId/orders")
  findAll(@Param("presentationId", ParseIntPipe) id: number) {
    return this.service.findAll(id);
  }

  @Patch("presentations/:presentationId/orders/reorder")
  reorder(@Param("presentationId", ParseIntPipe) id: number, @Body() dto: ReorderDto) {
    return this.service.reorder(id, dto);
  }

  @Put("orders/:id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.service.update(id, dto);
  }

  @Delete("orders/:id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
