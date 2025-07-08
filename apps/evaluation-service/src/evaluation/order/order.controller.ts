import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ReorderDto } from "@/evaluation/order/dto/reorder-orders.dto";
import { SaveOrdersDto } from "@/evaluation/order/dto/save-orders.dto";
import { UpdateOrderDto } from "@/evaluation/order/dto/update-order.dto";
import { OrderService } from "./order.service.js";

@ApiTags("orders")
@Controller()
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Post("presentations/:presentationId/orders")
  @ApiParam({ name: "presentationId", type: Number })
  @ApiOperation({ summary: "Remplace l’ordre complet" })
  save(@Param("presentationId", ParseIntPipe) presentationId: number, @Body() dto: SaveOrdersDto) {
    return this.service.saveOrderList(presentationId, dto);
  }

  @Get("presentations/:presentationId/orders")
  findAll(@Param("presentationId", ParseIntPipe) id: number) {
    return this.service.findAll(id);
  }

  @Put("orders/:id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.service.update(id, dto);
  }

  @Patch("presentations/:presentationId/orders/reorder")
  reorder(@Param("presentationId", ParseIntPipe) id: number, @Body() dto: ReorderDto) {
    return this.service.reorder(id, dto);
  }

  @Delete("orders/:id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
