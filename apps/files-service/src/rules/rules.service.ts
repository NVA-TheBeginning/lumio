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
        id: createRuleDto.deliverableId,
      },
    });

    if (!deliverable) {
      throw new NotFoundException("Deliverable not found");
    }

    return this.prisma.deliverablesRules.create({
      data: {
        deliverableId: createRuleDto.deliverableId,
        ruleType: createRuleDto.ruleType,
        ruleDetails: createRuleDto.ruleDetails,
      },
    });
  }

  async findAllByDeliverable(deliverableId: number): Promise<DeliverablesRules[]> {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: {
        id: deliverableId,
      },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${deliverableId} not found`);
    }

    const rules = await this.prisma.deliverablesRules.findMany({
      where: {
        deliverableId,
      },
    });

    return rules;
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
