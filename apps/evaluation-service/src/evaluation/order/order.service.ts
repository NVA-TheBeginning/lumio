import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(presentationId: number, dto: CreateOrderDto) {
    return this.prisma.presentationOrder.create({ data: { presentationId, ...dto } });
  }

  async findAll(presentationId: number) {
    return this.prisma.presentationOrder.findMany({ where: { presentationId } });
  }

  async findOne(id: number) {
    const order = await this.prisma.presentationOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order #${id} introuvable`);
    return order;
  }

  async update(id: number, dto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prisma.presentationOrder.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.presentationOrder.delete({ where: { id } });
  }
}
