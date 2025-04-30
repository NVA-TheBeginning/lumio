import { beforeEach, describe, expect, it, jest, Mock, mock, test } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { PaginationQueryDto } from "@/common/dto/pagination-query.dto.js";
import { Paginated } from "@/common/interfaces/pagination.interface.js";
import { ProjectsService } from "@/microservices/projects-groups/projects/projects.service.js";
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
  let service: ProjectsService;

  beforeEach(() => {
    service = { findProjectsForStudent: mock(async () => ({})) } as unknown as ProjectsService;
    controller = new ProjectsController({} as MicroserviceProxyService, service);
  });

  it("calls service with correct numeric pagination", async () => {
    const mockMap: Record<number, Paginated<unknown>> = {
      1: {
        data: [{ project: { id: 5 }, groupStatus: "no_groups" }],
        pagination: { totalRecords: 1, currentPage: 2, totalPages: 1, nextPage: null, prevPage: 1 },
      },
    };
    const svc = service.findProjectsForStudent as Mock<(id: number, page: number, size: number) => unknown>;
    // @ts-ignore
    svc.mockResolvedValueOnce(mockMap as Paginated<unknown>);

    const pagination = new PaginationQueryDto();
    pagination.page = 2;
    pagination.size = 5;

    const result = await controller.findByStudentDetailed(1, pagination);
    expect(service.findProjectsForStudent).toHaveBeenCalledWith(1, 2, 5);
    // @ts-ignore
    expect(result).toEqual(mockMap);
  });

  it("uses default pagination when none provided", async () => {
    const defaultMap: Record<number, Paginated<unknown>> = {
      1: { data: [], pagination: { totalRecords: 0, currentPage: 1, totalPages: 0, nextPage: null, prevPage: null } },
    };
    const svc = service.findProjectsForStudent as Mock<(id: number, page: number, size: number) => unknown>;
    // @ts-ignore
    svc.mockResolvedValueOnce(defaultMap);

    const pagination = new PaginationQueryDto();
    const result = await controller.findByStudentDetailed(1, pagination);
    expect(service.findProjectsForStudent).toHaveBeenCalledWith(1, 1, 10);
    // @ts-ignore
    expect(result).toEqual(defaultMap);
  });
});
