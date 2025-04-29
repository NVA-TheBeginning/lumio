import { beforeEach, describe, expect, it, Mock, mock } from "bun:test";
import { Project, ProjectsService } from "@/microservices/projects-groups/projects/projects.service.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

describe("ProjectsService", () => {
  let service: ProjectsService;
  let proxy: MicroserviceProxyService;

  beforeEach(() => {
    proxy = { forwardRequest: mock(async () => []) } as unknown as MicroserviceProxyService;
    service = new ProjectsService(proxy);
  });

  it("applies pagination and returns empty map on no promotions", async () => {
    // @ts-ignore
    (proxy.forwardRequest as Mock<Promise<Array<{ id: number }>>>).mockResolvedValueOnce([]);
    const res = await service.findProjectsForStudent(1, 2, 5);
    expect(res).toEqual({});
  });

  it("applies pagination and group status", async () => {
    const promos = [{ id: 10 }];
    const projects: Project[] = [
      { id: 100, name: "A", description: "", creatorId: 0, createdAt: new Date(), updatedAt: new Date() },
      { id: 101, name: "B", description: "", creatorId: 0, createdAt: new Date(), updatedAt: new Date() },
    ];
    const groups = [{ id: 200, name: "G1", members: [{ studentId: 2 }] }];

    // @ts-ignore
    (proxy.forwardRequest as Mock<Promise<Array<{ id: number }>>>)
      .mockResolvedValueOnce(promos)
      .mockResolvedValueOnce({ "10": projects })
      .mockResolvedValueOnce(groups);

    const res = await service.findProjectsForStudent(2, 1, 1);
    expect(res[10]).toHaveLength(1);
    expect(res[10][0].project.id).toBe(100);
    expect(res[10][0].groupStatus).toBe("in_group");
  });
});
