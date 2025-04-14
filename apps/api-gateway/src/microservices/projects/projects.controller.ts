import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

interface GroupSettingDto {
  promotionId: number;
  minMembers: number;
  maxMembers: number;
  mode: "AUTO" | "FREE" | "MANUAL";
  deadline: string;
}

interface CreateProjectDto extends Record<string, unknown> {
  name: string;
  description: string;
  creatorId: number;
  promotionIds: number[];
  groupSettings: GroupSettingDto[];
}

@Controller("projects")
export class ProjectsController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.proxy.forwardRequest("project", "/projects", "POST", createProjectDto);
  }
}
