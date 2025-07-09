import { Injectable, NotFoundException } from "@nestjs/common";
import { addMinutes } from "date-fns";
import { ReorderDto } from "@/evaluation/order/dto/reorder-orders.dto";
import { SaveOrdersDto } from "@/evaluation/order/dto/save-orders.dto";
import { UpdateOrderDto } from "@/evaluation/order/dto/update-order.dto";
import { PrismaService } from "@/prisma.service";

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async saveOrderList(presentationId: number, dto: SaveOrdersDto) {
    const pres = await this.prisma.presentation.findUniqueOrThrow({
      where: { id: presentationId },
      select: { startDatetime: true, durationPerGroup: true },
    });

    const { startDatetime: start, durationPerGroup: dur } = pres;

    return this.prisma.$transaction(async (tx) => {
      await tx.presentationOrder.deleteMany({ where: { presentationId } });
      await tx.presentationOrder.createMany({
        data: dto.groupIds.map((gid, idx) => ({
          presentationId,
          groupId: gid,
          orderNumber: idx + 1,
          scheduledDatetime: addMinutes(start, idx * dur),
        })),
      });
      return { created: dto.groupIds.length };
    });
  }

  async findAll(presentationId: number) {
    return this.prisma.presentationOrder.findMany({
      where: { presentationId },
      orderBy: { orderNumber: "asc" },
    });
  }

  async update(id: number, dto: UpdateOrderDto) {
    const current = await this.findOne(id);

    if (dto.orderNumber && dto.orderNumber !== current.orderNumber) {
      return this.moveToPosition(current.presentationId, id, dto.orderNumber, dto.groupId);
    }

    if (dto.groupId !== undefined) {
      await this.prisma.presentationOrder.update({
        where: { id },
        data: { groupId: dto.groupId },
      });
    }
    return this.findOne(id);
  }

  async reorder(presentationId: number, dto: ReorderDto) {
    const list = await this.prisma.presentationOrder.findMany({
      where: { presentationId },
      orderBy: { orderNumber: "asc" },
    });

    if (dto.from < 1 || dto.from > list.length) throw new NotFoundException("from hors limites");
    if (dto.to < 1 || dto.to > list.length) throw new NotFoundException("to hors limites");

    const movedId = list[dto.from - 1].id;

    return this.moveToPosition(presentationId, movedId, dto.to);
  }

  async remove(id: number) {
    const { presentationId } = await this.findOne(id);
    await this.prisma.presentationOrder.delete({ where: { id } });
    await this.resequence(presentationId);
    return { deleted: true };
  }

  private async findOne(id: number) {
    const record = await this.prisma.presentationOrder.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Order #${id} introuvable`);
    return record;
  }

  private async moveToPosition(
    presentationId: number,
    lineId: number | null,
    targetPos: number,
    newGroupId?: number | null,
    fromPos?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const list = await tx.presentationOrder.findMany({
        where: { presentationId },
        orderBy: { orderNumber: "asc" },
      });

      if (targetPos < 1 || targetPos > list.length + (lineId ? 0 : 1))
        throw new NotFoundException("orderNumber hors limites");

      if (lineId) {
        const idx = list.findIndex((o) => o.id === lineId);
        if (idx === -1) throw new NotFoundException(`Order #${lineId} introuvable`);
        list.splice(idx, 1);
      }
      if (!lineId && fromPos) {
        list.splice(fromPos - 1, 1);
      }

      const newLine = lineId
        ? { id: lineId, groupId: newGroupId ?? undefined }
        : { id: undefined, groupId: newGroupId ?? undefined };

      // biome-ignore lint/suspicious/noExplicitAny: any is needed here
      list.splice(targetPos - 1, 0, newLine as any);

      const pres = await tx.presentation.findUniqueOrThrow({
        where: { id: presentationId },
      });

      await Promise.all(
        list.map((o, i) =>
          o.id
            ? tx.presentationOrder.update({
                where: { id: o.id },
                data: {
                  orderNumber: i + 1,
                  groupId: o.groupId ?? undefined,
                  scheduledDatetime: addMinutes(pres.startDatetime, i * pres.durationPerGroup),
                },
              })
            : tx.presentationOrder.create({
                data: {
                  presentationId,
                  groupId: o.groupId ?? undefined,
                  orderNumber: i + 1,
                  scheduledDatetime: addMinutes(pres.startDatetime, i * pres.durationPerGroup),
                },
              }),
        ),
      );
      return { reordered: true };
    });
  }

  private async resequence(presentationId: number) {
    const pres = await this.prisma.presentation.findUniqueOrThrow({
      where: { id: presentationId },
    });
    const list = await this.prisma.presentationOrder.findMany({
      where: { presentationId },
      orderBy: { orderNumber: "asc" },
    });
    await Promise.all(
      list.map((o, i) =>
        this.prisma.presentationOrder.update({
          where: { id: o.id },
          data: {
            orderNumber: i + 1,
            scheduledDatetime: addMinutes(pres.startDatetime, i * pres.durationPerGroup),
          },
        }),
      ),
    );
  }
}
