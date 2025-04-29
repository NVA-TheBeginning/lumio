import { beforeEach, describe, expect, it, Mock, mock } from "bun:test";
import { Project, ProjectsService, ProjectWithGroupStatus } from "@/microservices/projects-groups/projects.service.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

describe("ProjectsService", () => {
  let service: ProjectsService;
  let proxy: MicroserviceProxyService;

  beforeEach(() => {
    proxy = { forwardRequest: mock(async () => []) } as unknown as MicroserviceProxyService;
    service = new ProjectsService(proxy);
  });

  it("returns empty map if no promotions", async () => {
    // @ts-ignore
    (proxy.forwardRequest as Mock<Promise<Array<{ id: number }>>>).mockResolvedValueOnce([]);
    const res = await service.findProjectsForStudent(1);
    expect(res).toEqual({});
  });

  it("enriches projects with group statuses", async () => {
    const promos = [{ id: 10 }];
    const projects: Project[] = [
      { id: 100, name: "A", description: "", creatorId: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    const groups = [
      { id: 200, name: "G1", members: [{ studentId: 1 }, { studentId: 2 }] },
      { id: 201, name: "G2", members: [{ studentId: 3 }] },
    ];

    // @ts-ignore
    (proxy.forwardRequest as Mock<Promise<Array<{ id: number }>>>)
      .mockResolvedValueOnce(promos)
      .mockResolvedValueOnce({ "10": projects })
      .mockResolvedValueOnce(groups);

    const res = await service.findProjectsForStudent(1);

    expect(proxy.forwardRequest).toHaveBeenNthCalledWith(1, "project", "/promotions/student/1", "GET");
    expect(proxy.forwardRequest).toHaveBeenNthCalledWith(2, "project", "/projects/by-promotions", "GET", undefined, {
      promotionIds: "10",
    });
    expect(proxy.forwardRequest).toHaveBeenNthCalledWith(3, "project", "/projects/100/promotions/10/groups", "GET");

    const expected: Record<number, ProjectWithGroupStatus[]> = {
      10: [
        {
          project: projects[0],
          groupStatus: "in_group",
          group: groups[0],
        },
      ],
    };
    expect(res).toEqual(expected);
  });
});
