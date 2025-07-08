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
  Put,
} from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ReorderDto } from "@/microservices/evaluations/order/dto/reorder-orders.dto.js";
import { SaveOrdersDto } from "@/microservices/evaluations/order/dto/save-orders.dto.js";
import { UpdateOrderDto } from "@/microservices/evaluations/order/dto/update-order.dto.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

@ApiTags("orders")
@Controller()
export class OrderController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("presentations/:presentationId/orders")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Enregistrer l’ordre (remplace tout)" })
  @ApiParam({ name: "presentationId", type: Number })
  @ApiBody({ type: SaveOrdersDto })
  save(@Param("presentationId", ParseIntPipe) presentationId: number, @Body() dto: SaveOrdersDto) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${presentationId}/orders`, "POST", dto);
  }

  @Get("presentations/:presentationId/orders")
  @HttpCode(HttpStatus.OK)
  findAll(@Param("presentationId", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${id}/orders`, "GET");
  }

  @Put("orders/:id")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: UpdateOrderDto })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.proxy.forwardRequest("evaluation", `/orders/${id}`, "PUT", dto);
  }

  @Patch("presentations/:presentationId/orders/reorder")
  @ApiBody({ type: ReorderDto })
  reorder(@Param("presentationId", ParseIntPipe) id: number, @Body() dto: ReorderDto) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${id}/orders/reorder`, "PATCH", dto);
  }

  @Delete("orders/:id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/orders/${id}`, "DELETE");
  }
}
