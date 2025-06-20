import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import {ScheduleDto} from "@/evaluation/order/dto/schedule.dto";

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

  async generateSchedule(presentationId: number): Promise<ScheduleDto[]> {
    const pres = await this.prisma.presentation.findUnique({
      where: { id: presentationId },
      include: { orders: { orderBy: { orderNumber: 'asc' } } },
    });
    if (!pres) {
      throw new NotFoundException(`Presentation #${presentationId} introuvable`);
    }

    const start = pres.startDatetime;
    const duration = pres.durationPerGroup; // en minutes

    return pres.orders.map(order => {
      const slotStart = new Date(
          start.getTime() + (order.orderNumber - 1) * duration * 60000
      );
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);
      return {
        groupId: order.groupId,
        orderNumber: order.orderNumber,
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      };
    });
  }
}
