import { beforeEach, describe, expect, jest, test } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { ProjectsController } from "./projects.controller.js";
import { CreateProjectDto } from "./projects.controller.js";
import { GroupMode } from "./projects.controller.js";

describe("ProjectsController", () => {
  let controller: ProjectsController;
  let proxy: MicroserviceProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: MicroserviceProxyService,
          useValue: {
            forwardRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    proxy = module.get<MicroserviceProxyService>(MicroserviceProxyService);
  });

  test("create calls proxy.forwardRequest with POST", async () => {
    const dto: CreateProjectDto = {
      name: "P",
      description: "D",
      creatorId: 1,
      promotionIds: [1, 2],
      groupSettings: [
        { promotionId: 1, minMembers: 2, maxMembers: 5, mode: GroupMode.FREE, deadline: new Date().toISOString() },
      ],
    };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 7, ...dto });

    const result = await controller.create(dto);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/projects", "POST", dto);
    expect(result).toEqual({ id: 7, ...dto });
  });

  test("findByCreator calls proxy.forwardRequest with GET", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const result = await controller.findByCreator(1);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/projects/creator/1", "GET");
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test("findAll calls proxy.forwardRequest with GET", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue([]);
    const result = await controller.findAll();
    expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/projects", "GET");
    expect(result).toEqual([]);
  });

  test("findOne calls proxy.forwardRequest with GET", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 5 });
    const result = await controller.findOne(5);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/projects/5", "GET");
    expect(result).toEqual({ id: 5 });
  });

  test("update calls proxy.forwardRequest with PATCH", async () => {
    const dto: Partial<CreateProjectDto> = { name: "X" };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 5, name: "X" });
    const result = await controller.update(5, dto);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/projects/5", "PATCH", dto);
    expect(result).toEqual({ id: 5, name: "X" });
  });

  test("remove calls proxy.forwardRequest with DELETE", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ deleted: true });
    const result = await controller.remove(5);
    expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/projects/5", "DELETE");
    expect(result).toEqual({ deleted: true });
  });
});
