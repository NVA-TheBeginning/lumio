import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma.service';
import { CreateDeliverableDto, UpdateDeliverableDto } from '@/deliverables/dto/deliverables.dto';
import { Deliverables } from '@prisma-files/client';

@Injectable()
export class DeliverablesService {
  constructor(private prisma: PrismaService) {}

  async create(createDeliverableDto: CreateDeliverableDto): Promise<Deliverables> {
    return this.prisma.deliverables.create({
      data: createDeliverableDto,
    });
  }

  async findAllByProjectPromo(projectId: number, promoId?: number): Promise<Deliverables[]> {
    return this.prisma.deliverables.findMany({
      where: { projectId, promotionId: promoId },
      orderBy: { deadline: 'asc' },
    });
  }

  async findOne(id: number): Promise<Deliverables> {
    const deliverable = await this.prisma.deliverables.findFirst({
      where: { 
        projectId: id 
      },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${id} not found`);
    }

    return deliverable;
  }

  async update(id: number, updateDeliverableDto: UpdateDeliverableDto): Promise<Deliverables> {
    try {
      const existingDeliverable = await this.findOne(id);
      
      return await this.prisma.deliverables.update({
        where: { 
          projectId_promotionId: {
            projectId: existingDeliverable.projectId,
            promotionId: existingDeliverable.promotionId,
          }
        },
        data: updateDeliverableDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Failed to update deliverable with ID ${id}`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const existingDeliverable = await this.findOne(id);
      
      await this.prisma.deliverables.delete({
        where: { 
          projectId_promotionId: {
            projectId: existingDeliverable.projectId,
            promotionId: existingDeliverable.promotionId,
          }
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Failed to delete deliverable with ID ${id}`);
    }
  }
}
