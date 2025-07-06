import { Injectable, NotFoundException } from "@nestjs/common";
import { addMinutes } from "date-fns";
import { PrismaService } from "@/prisma.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { GenerateOrdersDto } from "./dto/generate-orders.dto";
import { ReorderDto } from "./dto/reorder-orders.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(presentationId: number, dto: GenerateOrdersDto) {
    const pres = await this.prisma.presentation.findUnique({
      where: { id: presentationId },
      select: { startDatetime: true, durationPerGroup: true },
    });
    if (!pres) throw new NotFoundException(`Presentation #${presentationId} inconnue`);

    let list = [...dto.groupIds];
    if (dto.algorithm === "RANDOM") {
      list = shuffle(list, dto.shuffleSeed);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.presentationOrder.deleteMany({ where: { presentationId } });
      await tx.presentationOrder.createMany({
        data: list.map((gid, idx) => ({
          presentationId,
          groupId: gid,
          orderNumber: idx + 1,
          scheduledDatetime: addMinutes(pres.startDatetime, idx * pres.durationPerGroup),
        })),
      });
      return { created: list.length };
    });
  }

  async create(presentationId: number, dto: CreateOrderDto) {
    await this.prisma.presentation.findUniqueOrThrow({
      where: { id: presentationId },
    });
    const created = await this.prisma.presentationOrder.create({
      data: { presentationId, ...dto },
    });
    await this.resequence(presentationId);
    return created;
  }

  async findAll(presentationId: number) {
    return this.prisma.presentationOrder.findMany({
      where: { presentationId },
      orderBy: { orderNumber: "asc" },
    });
  }

  async reorder(presentationId: number, dto: ReorderDto) {
    return this.prisma.$transaction(async (tx) => {
      const list = await tx.presentationOrder.findMany({
        where: { presentationId },
        orderBy: { orderNumber: "asc" },
      });
      if (dto.from < 1 || dto.from > list.length) throw new NotFoundException("from hors limites");
      if (dto.to < 1 || dto.to > list.length) throw new NotFoundException("to hors limites");

      const [moved] = list.splice(dto.from - 1, 1);
      list.splice(dto.to - 1, 0, moved);
      const pres = await tx.presentation.findUniqueOrThrow({
        where: { id: presentationId },
      });
      await Promise.all(
        list.map((o, i) =>
          tx.presentationOrder.update({
            where: { id: o.id },
            data: {
              orderNumber: i + 1,
              scheduledDatetime: addMinutes(pres.startDatetime, i * pres.durationPerGroup),
            },
          }),
        ),
      );
      return { reordered: true };
    });
  }

  async update(id: number, dto: UpdateOrderDto) {
    const current = await this.findOne(id);

    if (dto.orderNumber !== undefined && dto.orderNumber !== current.orderNumber) {
      const targetPos = dto.orderNumber; // 1-based
      return this.moveToPosition(current.presentationId, id, targetPos);
    }

    await this.prisma.presentationOrder.update({ where: { id }, data: dto });
    await this.resequence(current.presentationId);
    return this.findOne(id);
  }

  private async moveToPosition(presentationId: number, id: number, targetPos: number) {
    return this.prisma.$transaction(async (tx) => {
      const list = await tx.presentationOrder.findMany({
        where: { presentationId },
        orderBy: { orderNumber: "asc" },
      });

      if (targetPos < 1 || targetPos > list.length) throw new NotFoundException("orderNumber hors limites");

      const idxCurrent = list.findIndex((o) => o.id === id);
      const [moved] = list.splice(idxCurrent, 1);
      list.splice(targetPos - 1, 0, moved);

      const pres = await tx.presentation.findUniqueOrThrow({ where: { id: presentationId } });
      await Promise.all(
        list.map((o, i) =>
          tx.presentationOrder.update({
            where: { id: o.id },
            data: {
              orderNumber: i + 1,
              scheduledDatetime: addMinutes(pres.startDatetime, i * pres.durationPerGroup),
            },
          }),
        ),
      );
      return moved;
    });
  }

  async remove(id: number) {
    const { presentationId } = await this.findOne(id);
    await this.prisma.presentationOrder.delete({ where: { id } });
    await this.resequence(presentationId);
    return { deleted: true };
  }

  private async findOne(id: number) {
    const o = await this.prisma.presentationOrder.findUnique({ where: { id } });
    if (!o) throw new NotFoundException(`Order #${id} introuvable`);
    return o;
  }

  private async resequence(presentationId: number) {
    await this.prisma.$transaction(async (tx) => {
      const pres = await tx.presentation.findUniqueOrThrow({
        where: { id: presentationId },
      });
      const list = await tx.presentationOrder.findMany({
        where: { presentationId },
        orderBy: { orderNumber: "asc" },
      });
      await Promise.all(
        list.map((o, i) =>
          tx.presentationOrder.update({
            where: { id: o.id },
            data: {
              orderNumber: i + 1,
              scheduledDatetime: addMinutes(pres.startDatetime, i * pres.durationPerGroup),
            },
          }),
        ),
      );
    });
  }
}

function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  const out = [...arr];
  let m = out.length;
  let i: number;
  let t: T;
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  while (m) {
    i = Math.floor(rnd() * m--);
    t = out[m];
    out[m] = out[i];
    out[i] = t;
  }
  return out;
}
