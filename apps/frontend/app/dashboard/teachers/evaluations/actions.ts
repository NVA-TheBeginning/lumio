"use server";

import type { CreateCriteriaDto, Criteria } from "@/lib/types";
import { createCriteria, getAllProjects, getAllCriteria } from "../projects/actions";

export interface ProjectWithCriteria {
  id: number;
  name: string;
  description: string;
  hasReport: boolean;
  promotions: {
    id: number;
    name: string;
    status: string;
    criteria?: Criteria[];
  }[];
  createdAt: string;
  updatedAt: string;
}

export async function getAllProjectsWithCriteria(): Promise<ProjectWithCriteria[]> {
  const projectsResponse = await getAllProjects(1, 100); // Get all projects
  const projects = projectsResponse.data;

  const projectsWithCriteria = await Promise.all(
    projects.map(async (project) => {
      const promotionsWithCriteria = await Promise.all(
        project.promotions.map(async (promotion) => {
          try {
            const criteria = await getAllCriteria(project.id, promotion.id);
            return {
              ...promotion,
              criteria: criteria || [],
            };
          } catch {
            return {
              ...promotion,
              criteria: [],
            };
          }
        }),
      );

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        hasReport: project.hasReport,
        promotions: promotionsWithCriteria,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    }),
  );

  return projectsWithCriteria;
}

export async function copyCriteria(
  sourceProjectId: number,
  sourcePromotionId: number,
  targetProjectId: number,
  targetPromotionId: number,
): Promise<Criteria[]> {
  // Get source criteria
  const sourceCriteria = await getAllCriteria(sourceProjectId, sourcePromotionId);

  if (!sourceCriteria || sourceCriteria.length === 0) {
    throw new Error("No criteria found in source project");
  }

  // Create new criteria for target project
  const newCriteria = await Promise.all(
    sourceCriteria.map(async (criterion) => {
      const createData: CreateCriteriaDto = {
        name: criterion.name,
        weight: criterion.weight,
        type: criterion.type,
        individual: criterion.individual,
      };

      return await createCriteria(targetProjectId, targetPromotionId, createData);
    }),
  );

  return newCriteria;
}
