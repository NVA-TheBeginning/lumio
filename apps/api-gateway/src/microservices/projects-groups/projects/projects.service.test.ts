import { beforeEach, describe, expect, it, Mock, mock } from "bun:test";
import { Paginated } from "@/common/interfaces/pagination.interface.js";
import {
  Group,
  Project,
  ProjectsService,
  ProjectWithGroupStatus,
} from "@/microservices/projects-groups/projects/projects.service.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

describe("ProjectsService.findProjectsForStudent", () => {
  let service: ProjectsService;
  let proxy: MicroserviceProxyService;

  beforeEach(() => {
    proxy = { forwardRequest: mock(async () => []) } as unknown as MicroserviceProxyService;
    service = new ProjectsService(proxy);
  });

  it("returns empty map when no promotions", async () => {
    // @ts-ignore
    (proxy.forwardRequest as Mock<() => unknown>).mockResolvedValueOnce([]);
    const result = await service.findProjectsForStudent(1);
    expect(result).toEqual({});
  });

  it("paginates and sets groupStatus correctly", async () => {
    const studentId = 2;
    const promos = [{ id: 10 }];
    const projects: Project[] = [
      { id: 100, name: "A", description: "", creatorId: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 101, name: "B", description: "", creatorId: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 102, name: "C", description: "", creatorId: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    const groupsFor100 = [{ id: 200, name: "G1", members: [{ studentId }] }];
    const groupsFor101: Group[] = [{ id: 201, name: "G2", members: [{ studentId: 999 }] }];
    (proxy.forwardRequest as Mock<() => unknown>)
      // @ts-ignore
      .mockResolvedValueOnce(promos)
      // @ts-ignore
      .mockResolvedValueOnce({ "10": projects })
      // @ts-ignore
      .mockResolvedValueOnce(groupsFor100)
      // @ts-ignore
      .mockResolvedValueOnce(groupsFor101)
      // @ts-ignore
      .mockResolvedValueOnce(groupsFor101);

    const result = await service.findProjectsForStudent(studentId, 1, 2);

    const page = result[10] as unknown as Paginated<{ project: Project; groupStatus: string }>[];
    expect(Object.keys(result)).toContain("10");
    const paginated = result[10] as Paginated<ProjectWithGroupStatus>;
    expect(paginated.data.length).toBe(2);
    expect(paginated.pagination).toMatchObject({
      totalRecords: 3,
      currentPage: 1,
      totalPages: 2,
      nextPage: 2,
      prevPage: null,
    });
    expect(paginated.data[0].groupStatus).toBe("in_group");
    expect(paginated.data[1].groupStatus).toBe("not_in_group");
  });
});
