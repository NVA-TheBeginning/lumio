import { beforeEach, describe, expect, jest, test } from "bun:test";
import { Test, TestingModule } from "@nestjs/testing";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { AddMembersDto, CreateGroupDto, GroupMode, GroupSettingsDto, UpdateGroupDto } from "./dto/group.dto.js";
import { GroupsController } from "./groups.controller.js";

describe("GroupsController", () => {
  let controller: GroupsController;
  let proxy: MicroserviceProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: MicroserviceProxyService,
          useValue: {
            forwardRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    proxy = module.get<MicroserviceProxyService>(MicroserviceProxyService);
  });

  test("create calls proxy.forwardRequest with correct args", async () => {
    const dto: CreateGroupDto = { numberOfGroups: 3, baseName: "G" };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue(["g1", "g2", "g3"]);

    const result = await controller.create(1, 2, dto);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("group", "/projects/1/promotions/2/groups", "POST", dto);
    expect(result).toEqual(["g1", "g2", "g3"]);
  });

  test("findAll calls proxy.forwardRequest with GET", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue([]);

    const result = await controller.findAll(1, 2);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("group", "/projects/1/promotions/2/groups", "GET");
    expect(result).toEqual([]);
  });

  test("update calls proxy.forwardRequest with PUT", async () => {
    const dto: UpdateGroupDto = { name: "NewName" };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ id: 5, name: "NewName" });

    const result = await controller.update(5, dto);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("group", "/groups/5", "PUT", dto);
    expect(result).toEqual({ id: 5, name: "NewName" });
  });

  test("remove calls proxy.forwardRequest with DELETE", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ deleted: true });

    const result = await controller.remove(5);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("group", "/groups/5", "DELETE");
    expect(result).toEqual({ deleted: true });
  });

  test("addMembers calls proxy.forwardRequest with POST", async () => {
    const dto: AddMembersDto = { studentIds: [1, 2] };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ added: 2 });

    const result = await controller.addMembers(5, dto);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("group", "/groups/5/students", "POST", dto);
    expect(result).toEqual({ added: 2 });
  });

  test("removeMember calls proxy.forwardRequest with DELETE", async () => {
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ removed: true });

    const result = await controller.removeMember(5, 42);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("group", "/groups/5/students/42", "DELETE");
    expect(result).toEqual({ removed: true });
  });

  test("getSettings calls proxy.forwardRequest with GET", async () => {
    const settings: GroupSettingsDto = {
      minMembers: 2,
      maxMembers: 5,
      mode: GroupMode.FREE,
      deadline: new Date().toISOString(),
    };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue(settings);

    const result = await controller.getSettings(1, 2);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("group", "/projects/1/promotions/2/group-settings", "GET");
    expect(result).toEqual(settings);
  });

  test("updateSettings calls proxy.forwardRequest with PATCH", async () => {
    const dto: GroupSettingsDto = {
      minMembers: 1,
      maxMembers: 4,
      mode: GroupMode.MANUAL,
      deadline: new Date().toISOString(),
    };
    (proxy.forwardRequest as jest.Mock).mockResolvedValue({ success: true });

    const result = await controller.updateSettings(1, 2, dto);

    expect(proxy.forwardRequest).toHaveBeenCalledWith("group", "/projects/1/promotions/2/group-settings", "PATCH", dto);
    expect(result).toEqual({ success: true });
  });
});
