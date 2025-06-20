import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreateOrderDto } from "../dto/create-order.dto.js";
import { UpdateOrderDto } from "../dto/update-order.dto.js";

@ApiTags("orders")
@Controller()
export class OrderController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("presentations/:presentationId/orders")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer un ordre de passage" })
  @ApiParam({ name: "presentationId", type: Number })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: "Ordre créé." })
  create(@Param("presentationId", ParseIntPipe) presentationId: number, @Body() dto: CreateOrderDto) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${presentationId}/orders`, "POST", dto);
  }

  @Get("presentations/:presentationId/orders")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister les ordres de passage" })
  @ApiParam({ name: "presentationId", type: Number })
  @ApiResponse({ status: 200, description: "Liste des ordres." })
  findAll(@Param("presentationId", ParseIntPipe) presentationId: number) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${presentationId}/orders`, "GET");
  }

  @Put("orders/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mettre à jour un ordre de passage" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({ status: 200, description: "Ordre mis à jour." })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.proxy.forwardRequest("evaluation", `/orders/${id}`, "PUT", dto);
  }

  @Delete("orders/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Supprimer un ordre de passage" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, description: "Ordre supprimé." })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/orders/${id}`, "DELETE");
  }
}
