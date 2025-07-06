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
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import { GenerateOrdersDto } from "./dto/generate-orders.dto.js";
import { GenerateOrdersInputDto } from "./dto/generate-orders-input.dto.js";
import { ReorderDto } from "./dto/reorder-orders.dto.js";
import { UpdateOrderDto } from "./dto/update-order.dto.js";

interface PresentationMeta {
  projectId: number;
  promotionId: number;
}

@ApiTags("orders")
@Controller()
export class OrderController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("presentations/:presentationId/orders/generate")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Générer tout le planning" })
  @ApiParam({ name: "presentationId", type: Number })
  @ApiBody({ type: GenerateOrdersInputDto })
  @ApiResponse({ status: 201 })
  async generate(@Param("presentationId", ParseIntPipe) presentationId: number, @Body() dto: GenerateOrdersInputDto) {
    const pres = await this.proxy.forwardRequest<PresentationMeta>(
      "evaluation",
      `/presentations/${presentationId}`,
      "GET",
    );

    const groups: { id: number }[] = await this.proxy.forwardRequest(
      "project",
      `/projects/${pres.projectId}/promotions/${pres.promotionId}/groups`,
      "GET",
    );

    if (!groups.length) return { message: "Aucun groupe, rien à générer", created: 0 };

    const payload: GenerateOrdersDto = {
      ...dto,
      algorithm: dto.algorithm ?? "SEQUENTIAL",
      groupIds: groups.map((g) => g.id),
    };

    return this.proxy.forwardRequest("evaluation", `/presentations/${presentationId}/orders/generate`, "POST", payload);
  }

  @Post("presentations/:presentationId/orders")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer / insérer un slot" })
  @ApiParam({ name: "presentationId", type: Number })
  @ApiBody({ type: CreateOrderDto })
  create(@Param("presentationId", ParseIntPipe) presentationId: number, @Body() dto: CreateOrderDto) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${presentationId}/orders`, "POST", dto);
  }

  @Get("presentations/:presentationId/orders")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Lister les ordres" })
  findAll(@Param("presentationId", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${id}/orders`, "GET");
  }

  @Patch("presentations/:presentationId/orders/reorder")
  @ApiBody({ type: ReorderDto })
  reorder(@Param("presentationId", ParseIntPipe) id: number, @Body() dto: ReorderDto) {
    return this.proxy.forwardRequest("evaluation", `/presentations/${id}/orders/reorder`, "PATCH", dto);
  }

  @Put("orders/:id")
  @ApiBody({ type: UpdateOrderDto })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.proxy.forwardRequest("evaluation", `/orders/${id}`, "PUT", dto);
  }

  @Delete("orders/:id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("evaluation", `/orders/${id}`, "DELETE");
  }
}
