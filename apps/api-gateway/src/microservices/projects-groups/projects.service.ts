import { BadRequestException, Injectable } from "@nestjs/common";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

export interface Project {
  id: number;
  name: string;
  description: string;
  creatorId: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Group {
  id: number;
  name?: string;
  members: Array<{ studentId: number }>;
}

export type GroupStatus = "no_groups" | "not_in_group" | "in_group";

export interface ProjectWithGroupStatus {
  project: Project;
  groupStatus: GroupStatus;
  group?: Group;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  /**
   * Récupère pour un étudiant tous ses projets classés par promotion,
   * avec le statut de groupe (aucun groupe, pas dans un groupe, ou son groupe).
   */
  async findProjectsForStudent(studentId: number): Promise<Record<number, ProjectWithGroupStatus[]>> {
    if (!studentId) throw new BadRequestException("studentId is required");

    const promotions = await this.proxy.forwardRequest<Array<{ id: number }>>(
      "project",
      `/promotions/student/${studentId}`,
      "GET",
    );

    const promotionIds = promotions.map((p) => p.id);
    if (promotionIds.length === 0) return {};

    const byPromos = await this.proxy.forwardRequest<Record<string, Project[]>>(
      "project",
      "/projects/by-promotions",
      "GET",
      undefined,
      { promotionIds: promotionIds.join(",") },
    );

    const resultsByPromotion: Map<number, ProjectWithGroupStatus[]> = new Map();

    promotionIds.forEach((pid) => {
      resultsByPromotion.set(pid, []);
    });

    const projectPromotionPairs: Array<{ project: Project; promotionId: number }> = [];

    promotionIds.forEach((pid) => {
      const projects = byPromos[pid] ?? [];
      projects.forEach((project) => {
        projectPromotionPairs.push({ project, promotionId: pid });
      });
    });

    await Promise.all(
      projectPromotionPairs.map(async ({ project, promotionId }) => {
        const groups = await this.proxy.forwardRequest<Group[]>(
          "group",
          `/projects/${project.id}/promotions/${promotionId}/groups`,
          "GET",
        );

        let groupStatus: GroupStatus;
        let ownGroup: Group | undefined;

        if (!groups || groups.length === 0) {
          groupStatus = "no_groups";
        } else {
          ownGroup = groups.find((g) => g.members.some((m) => m.studentId === studentId));
          groupStatus = ownGroup ? "in_group" : "not_in_group";
        }

        const enrichedProject: ProjectWithGroupStatus = {
          project,
          groupStatus,
          group: ownGroup,
        };

        resultsByPromotion.get(promotionId)?.push(enrichedProject);
      }),
    );

    return Object.fromEntries(resultsByPromotion.entries()) as Record<number, ProjectWithGroupStatus[]>;
  }
}
