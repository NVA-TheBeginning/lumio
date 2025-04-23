import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Deliverables } from "@prisma-files/client";
import { CreateDeliverableDto, UpdateDeliverableDto } from "@/deliverables/dto/deliverables.dto";
import { PrismaService } from "@/prisma.service";

@Injectable()
export class DeliverablesService {
  constructor(private prisma: PrismaService) {}

  async create(createDeliverableDto: CreateDeliverableDto): Promise<Deliverables> {
    if (createDeliverableDto.deadline && new Date(createDeliverableDto.deadline) < new Date()) {
      throw new BadRequestException("Cannot create deliverable with past deadline");
    }

    if (createDeliverableDto.lateSubmissionPenalty && createDeliverableDto.lateSubmissionPenalty < 0) {
      throw new BadRequestException("Late submission penalty cannot be negative");
    }

    return this.prisma.deliverables.create({
      data: createDeliverableDto,
    });
  }

  async findAllByProjectPromo(projectId: number, promoId?: number): Promise<Deliverables[]> {
    return this.prisma.deliverables.findMany({
      where: { projectId, promotionId: promoId },
      orderBy: { deadline: "asc" },
    });
  }

  async update(updateDeliverableDto: UpdateDeliverableDto): Promise<Deliverables> {
    try {
      const existingDeliverable = await this.prisma.deliverables.findUnique({
        where: {
          projectId_promotionId: {
            projectId: updateDeliverableDto.projectId,
            promotionId: updateDeliverableDto.promotionId,
          },
        },
      });
      if (!existingDeliverable) {
        throw new NotFoundException("Deliverable not found");
      }

      if (updateDeliverableDto.deadline && new Date(updateDeliverableDto.deadline) < new Date()) {
        throw new BadRequestException("Cannot update deliverable with past deadline");
      }

      if (updateDeliverableDto.lateSubmissionPenalty && updateDeliverableDto.lateSubmissionPenalty < 0) {
        throw new BadRequestException("Late submission penalty cannot be negative");
      }

      return await this.prisma.deliverables.update({
        where: {
          projectId_promotionId: {
            projectId: existingDeliverable.projectId,
            promotionId: existingDeliverable.promotionId,
          },
        },
        data: updateDeliverableDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Failed to update deliverable with ID ${updateDeliverableDto.promotionId}`);
    }
  }

  async remove(projectId: number, promotionId: number): Promise<void> {
    try {
      const existingDeliverable = await this.prisma.deliverables.findUnique({
        where: {
          projectId_promotionId: {
            projectId,
            promotionId,
          },
        },
      });
      if (!existingDeliverable) {
        throw new NotFoundException("Deliverable not found");
      }

      await this.prisma.deliverables.delete({
        where: {
          projectId_promotionId: {
            projectId,
            promotionId,
          },
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Failed to delete deliverable with ID ${promotionId}`);
    }
  }
}
