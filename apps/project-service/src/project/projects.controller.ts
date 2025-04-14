import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateProjectDto } from "./dto/create-project.dto";
import { ProjectService } from "./projects.service";

@ApiTags("projects")
@Controller("projects")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new project with group settings for each promotion" })
  @ApiResponse({ status: 201, description: "Project has been successfully created." })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }
}
