import { Injectable } from "@nestjs/common";
import { Paginated } from "@/common/interfaces/pagination.interface.js";

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

export type ProjectsByPromotion = Record<number, Paginated<ProjectWithGroupStatus>>;

@Injectable()
export class ProjectsService {}
