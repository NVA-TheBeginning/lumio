import { BadRequestException, Injectable } from "@nestjs/common";
import { ProjectStatus } from "@prisma-project/client";
import { PrismaService } from "@/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    const { name, description, creatorId, promotionIds, groupSettings } = createProjectDto;

    const promotions = await this.prisma.promotion.findMany({
      where: {
        id: { in: promotionIds },
      },
    });

    if (promotions.length !== promotionIds.length) {
      throw new BadRequestException("One or more promotions do not exist");
    }

    const groupSettingPromotionIds = groupSettings.map((gs) => gs.promotionId);
    const invalidPromotionIds = groupSettingPromotionIds.filter((id) => !promotionIds.includes(id));

    if (invalidPromotionIds.length > 0) {
      throw new BadRequestException(`Group settings contain invalid promotion ids: ${invalidPromotionIds.join(", ")}`);
    }
    for (const gs of groupSettings) {
      if (gs.minMembers > gs.maxMembers) {
        throw new BadRequestException("minMembers cannot be greater than maxMembers");
      }
      if (new Date(gs.deadline) < new Date()) {
        throw new BadRequestException("Deadline must be in the future");
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      const project = await prisma.project.create({
        data: {
          name,
          description,
          creatorId,
        },
      });

      await prisma.projectPromotion.createMany({
        data: promotionIds.map((promotionId) => ({
          projectId: project.id,
          promotionId,
          status: ProjectStatus.DRAFT,
        })),
      });

      await prisma.groupSettings.createMany({
        data: groupSettings.map((gs) => ({
          projectId: project.id,
          promotionId: gs.promotionId,
          minMembers: gs.minMembers,
          maxMembers: gs.maxMembers,
          mode: gs.mode,
          deadline: new Date(gs.deadline),
        })),
      });

      return project;
    });
  }
}
