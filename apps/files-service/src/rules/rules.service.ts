import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DeliverablesRules, RuleType } from "@prisma-files/client";
import { PrismaService } from "@/prisma.service";
import {
  CreateDeliverableRuleDto,
  DirectoryStructureRuleDetails,
  FilePresenceRuleDetails,
  SizeLimitRuleDetails,
  UpdateDeliverableRuleDto,
} from "@/rules/dto/rules.dto";

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

    this.validateRuleDetails(createRuleDto.ruleType, createRuleDto.ruleDetails);

    return this.prisma.deliverablesRules.create({
      data: {
        deliverableId: createRuleDto.deliverableId,
        ruleType: createRuleDto.ruleType,
        ruleDetails: JSON.stringify(createRuleDto.ruleDetails),
      },
    });
  }

  private validateRuleDetails(
    ruleType: RuleType,
    ruleDetails: SizeLimitRuleDetails | FilePresenceRuleDetails | DirectoryStructureRuleDetails,
  ): void {
    switch (ruleType) {
      case RuleType.SIZE_LIMIT: {
        const sizeRule = ruleDetails as SizeLimitRuleDetails;
        if (!sizeRule.maxSizeInBytes || sizeRule.maxSizeInBytes <= 0) {
          throw new BadRequestException("SIZE_LIMIT rule must have a valid maxSizeInBytes value");
        }
        break;
      }

      case RuleType.FILE_PRESENCE: {
        const fileRule = ruleDetails as FilePresenceRuleDetails;
        if (!fileRule.requiredFiles || fileRule.requiredFiles.length === 0) {
          throw new BadRequestException("FILE_PRESENCE rule must have at least one required file");
        }
        break;
      }

      case RuleType.DIRECTORY_STRUCTURE: {
        const dirRule = ruleDetails as DirectoryStructureRuleDetails;
        if (!dirRule.requiredDirectories || dirRule.requiredDirectories.length === 0) {
          throw new BadRequestException("DIRECTORY_STRUCTURE rule must have at least one required directory");
        }
        break;
      }

      default:
        throw new BadRequestException(`Unsupported rule type: ${ruleType}`);
    }
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

      const updateData: Partial<{ ruleType: RuleType; ruleDetails: string }> = {};

      if (updateRuleDto.ruleType !== undefined) {
        updateData.ruleType = updateRuleDto.ruleType;
      }

      if (updateRuleDto.ruleDetails !== undefined) {
        // Validate if both ruleType and ruleDetails are provided, or get existing ruleType
        const ruleType = updateRuleDto.ruleType || (await this.findOne(id)).ruleType;
        this.validateRuleDetails(ruleType, updateRuleDto.ruleDetails);
        updateData.ruleDetails = JSON.stringify(updateRuleDto.ruleDetails);
      }

      return await this.prisma.deliverablesRules.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
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
