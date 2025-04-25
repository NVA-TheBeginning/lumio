import { Injectable, NotFoundException } from "@nestjs/common";
import { DeliverablesRules } from "@prisma-files/client";
import { PrismaService } from "@/prisma.service";
import { CreateDeliverableRuleDto, UpdateDeliverableRuleDto } from "@/rules/dto/rules.dto";

@Injectable()
export class DeliverableRulesService {
  constructor(private prisma: PrismaService) {}

  async create(createRuleDto: CreateDeliverableRuleDto): Promise<DeliverablesRules> {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: {
        projectId_promotionId: {
          projectId: Number(createRuleDto.projectId),
          promotionId: Number(createRuleDto.promotionId),
        },
      },
    });

    if (!deliverable) {
      throw new NotFoundException("Deliverable not found");
    }

    return this.prisma.deliverablesRules.create({
      data: {
        ...createRuleDto,
        deliverableId: deliverable.id,
        projectId: Number(createRuleDto.projectId),
        promotionId: Number(createRuleDto.promotionId),
      },
    });
  }

  async findAllByProjectPromo(projectId: number, promotionId: number): Promise<DeliverablesRules[]> {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: {
        projectId_promotionId: {
          projectId,
          promotionId,
        },
      },
    });

    if (!deliverable) {
      throw new NotFoundException("Deliverable not found");
    }

    return this.prisma.deliverablesRules.findMany({
      where: {
        projectId,
        promotionId,
      },
    });
  }

  async findOne(id: number): Promise<DeliverablesRules> {
    const rule = await this.prisma.deliverablesRules.findUnique({
      where: { id },
    });

    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }

    return rule;
  }

  async update(id: number, updateRuleDto: UpdateDeliverableRuleDto): Promise<DeliverablesRules> {
    try {
      await this.findOne(id);

      return await this.prisma.deliverablesRules.update({
        where: { id },
        data: updateRuleDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Failed to update rule with ID ${id}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.findOne(id);

      await this.prisma.deliverablesRules.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Failed to delete rule with ID ${id}`);
    }
  }
}
