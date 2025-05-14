import { beforeEach, describe, expect, it, jest, test } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { ProjectsByPromotion, ProjectsService } from "@/microservices/projects-groups/projects/projects.service.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreateProjectDto, GroupMode, ProjectsController } from "./projects.controller.js";

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
        {
          provide: ProjectsService,
          useValue: {
            findProjectsForStudent: jest.fn(),
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

describe("ProjectsController.findByStudentDetailed", () => {
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
        {
          provide: ProjectsService,
          useValue: {
            findProjectsForStudent: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    proxy = module.get<MicroserviceProxyService>(MicroserviceProxyService);
  });

  it("calls proxy.forwardRequest with the correct route and numeric pagination", async () => {
    const mockMap: ProjectsByPromotion = {
      1: {
        data: [{ project: { id: 5 } } as any /* … */],
        pagination: {
          totalRecords: 1,
          currentPage: 2,
          totalPages: 1,
          nextPage: null,
          prevPage: 1,
        },
      },
    };
    (proxy.forwardRequest as jest.Mock).mockResolvedValueOnce(mockMap);

    const result = await controller.findByStudentDetailed(1, 2, 5);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/projects/student/1/detailed", "GET", undefined, {
      page: "2",
      size: "5",
    });
    expect(result).toEqual(mockMap);
  });

  it("uses default pagination when none provided", async () => {
    const defaultMap: ProjectsByPromotion = {
      1: {
        data: [],
        pagination: {
          totalRecords: 0,
          currentPage: 1,
          totalPages: 0,
          nextPage: null,
          prevPage: null,
        },
      },
    };
    (proxy.forwardRequest as jest.Mock).mockResolvedValueOnce(defaultMap);

    const result = await controller.findByStudentDetailed(1, undefined, undefined);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("project", "/projects/student/1/detailed", "GET", undefined, {
      page: "1",
      size: "10",
    });
    expect(result).toEqual(defaultMap);
  });
});
