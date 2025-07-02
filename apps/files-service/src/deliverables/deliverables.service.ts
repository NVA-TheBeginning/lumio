import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma-files";
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

    if (createDeliverableDto.lateSubmissionPenalty && !createDeliverableDto.allowLateSubmission) {
      createDeliverableDto.lateSubmissionPenalty = 0.0;
    }

    return this.prisma.deliverables.create({
      data: createDeliverableDto,
    });
  }

  async findAllByProjectPromo(projectId: number, promotionId?: number): Promise<Deliverables[]> {
    return this.prisma.deliverables.findMany({
      where: { projectId, promotionId },
      orderBy: { deadline: "asc" },
    });
  }

  async update(updateDeliverableDto: UpdateDeliverableDto): Promise<Deliverables> {
    try {
      const existingDeliverable = await this.prisma.deliverables.findUnique({
        where: {
          id: updateDeliverableDto.id,
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

      if (updateDeliverableDto.lateSubmissionPenalty && !updateDeliverableDto.allowLateSubmission) {
        updateDeliverableDto.lateSubmissionPenalty = 0.0;
      }

      return await this.prisma.deliverables.update({
        where: {
          id: existingDeliverable.id,
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

  async remove(id: number): Promise<void> {
    try {
      const existingDeliverable = await this.prisma.deliverables.findUnique({
        where: {
          id,
        },
      });
      if (!existingDeliverable) {
        throw new NotFoundException("Deliverable not found");
      }

      await this.prisma.deliverables.delete({
        where: {
          id,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Failed to delete deliverable with ID ${id}`);
    }
  }

  async getCalendarDeliverables(
    promotionId?: number,
    startDate?: Date,
    endDate?: Date,
    projectId?: number,
  ): Promise<Deliverables[]> {
    const where: Prisma.DeliverablesWhereInput = {};
    if (promotionId) {
      where.promotionId = promotionId;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (startDate || endDate) {
      where.deadline = {};
      if (startDate) {
        where.deadline.gte = startDate;
      }
      if (endDate) {
        where.deadline.lte = endDate;
      }
    }
    return this.prisma.deliverables.findMany({
      where,
      orderBy: { deadline: "asc" },
    });
  }
}
