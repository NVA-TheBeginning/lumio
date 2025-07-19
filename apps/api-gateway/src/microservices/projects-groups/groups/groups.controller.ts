import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { AddMembersDto, CreateGroupDto, GroupSettingsDto, UpdateGroupDto } from "../dto/group.dto.js";
import { StudentDto } from "../dto/promotions.dto.js";

interface GroupMember {
  studentId: number;
  addedAt: Date;
  groupId: number;
}

interface Group {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  promotionId: number;
  projectId: number;
  members: GroupMember[];
}

interface EnrichedGroupMember {
  id: number;
  lastname: string;
  firstname: string;
  email: string;
  addedAt: Date;
  groupId: number;
}

interface EnrichedGroup extends Omit<Group, "members"> {
  members: EnrichedGroupMember[];
}

@ApiTags("groups")
@Controller()
export class GroupsController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("projects/:projectId/promotions/:promotionId/groups")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create skeleton groups for a project‑promotion" })
  @ApiParam({ name: "projectId", type: Number })
  @ApiParam({ name: "promotionId", type: Number })
  @ApiBody({ type: CreateGroupDto })
  @ApiCreatedResponse({ description: "Groups created successfully" })
  create(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
    @Body() dto: CreateGroupDto,
  ) {
    return this.proxy.forwardRequest("project", `/projects/${projectId}/promotions/${promotionId}/groups`, "POST", dto);
  }

  @Get("projects/:projectId/promotions/:promotionId/groups")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "List all groups for a project‑promotion" })
  @ApiParam({ name: "projectId", type: Number })
  @ApiParam({ name: "promotionId", type: Number })
  @ApiOkResponse({ description: "Array of groups" })
  async findAll(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
  ) {
    try {
      const groups = await this.proxy.forwardRequest<Group[]>(
        "project",
        `/projects/${projectId}/promotions/${promotionId}/groups`,
        "GET",
      );

      if (!groups.length) {
        return [];
      }

      const studentIds = Array.from(
        new Set(groups.flatMap((group) => group.members.map((member) => member.studentId))),
      );

      if (!studentIds.length) {
        return groups.map((group) => ({
          ...group,
          members: [],
        }));
      }

      const students = await this.proxy.forwardRequest<{ data: StudentDto[] }>(
        "auth",
        `/users?ids=${studentIds.join(",")}`,
        "GET",
      );
      const studentsData = students.data;

      const studentsMap = new Map<number, StudentDto>();
      studentsData.forEach((student) => {
        studentsMap.set(student.id, student);
      });

      const enrichedGroups: EnrichedGroup[] = groups.map((group) => ({
        ...group,
        members: group.members.map((member) => {
          const student = studentsMap.get(member.studentId);
          return {
            id: member.studentId,
            lastname: student?.lastname ?? "",
            firstname: student?.firstname ?? "",
            email: student?.email ?? "",
            addedAt: member.addedAt,
            groupId: member.groupId,
          };
        }),
      }));

      return enrichedGroups;
    } catch (error) {
      console.error("Failed to fetch groups with members:", error);
      throw new Error(`Unable to retrieve groups for project ${projectId} and promotion ${promotionId}`);
    }
  }

  @Put("groups/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update a group's properties" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: UpdateGroupDto })
  @ApiOkResponse({ description: "Group updated successfully" })
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateGroupDto) {
    return this.proxy.forwardRequest("project", `/groups/${id}`, "PUT", dto);
  }

  @Delete("groups/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a group" })
  @ApiParam({ name: "id", type: Number })
  @ApiOkResponse({ description: "Group deleted successfully" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("project", `/groups/${id}`, "DELETE");
  }

  @Post("groups/:id/students")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Add students to a group" })
  @ApiParam({ name: "id", type: Number })
  @ApiBody({ type: AddMembersDto })
  @ApiOkResponse({ description: "Students added to group" })
  addMembers(@Param("id", ParseIntPipe) id: number, @Body() dto: AddMembersDto) {
    return this.proxy.forwardRequest("project", `/groups/${id}/students`, "POST", dto);
  }

  @Delete("groups/:id/students/:userId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove a student from a group" })
  @ApiParam({ name: "id", type: Number })
  @ApiParam({ name: "userId", type: Number })
  @ApiOkResponse({ description: "Student removed from group" })
  removeMember(@Param("id", ParseIntPipe) id: number, @Param("userId", ParseIntPipe) userId: number) {
    return this.proxy.forwardRequest("project", `/groups/${id}/students/${userId}`, "DELETE");
  }

  @Get("projects/:projectId/promotions/:promotionId/group-settings")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Get group settings for a project‑promotion" })
  @ApiParam({ name: "projectId", type: Number })
  @ApiParam({ name: "promotionId", type: Number })
  @ApiOkResponse({ description: "Current group settings" })
  getSettings(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
  ) {
    return this.proxy.forwardRequest(
      "project",
      `/projects/${projectId}/promotions/${promotionId}/group-settings`,
      "GET",
    );
  }

  @Patch("projects/:projectId/promotions/:promotionId/group-settings")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update group settings for a project‑promotion" })
  @ApiParam({ name: "projectId", type: Number })
  @ApiParam({ name: "promotionId", type: Number })
  @ApiBody({ type: GroupSettingsDto })
  @ApiOkResponse({ description: "Group settings updated" })
  updateSettings(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
    @Body() dto: GroupSettingsDto,
  ) {
    return this.proxy.forwardRequest(
      "project",
      `/projects/${projectId}/promotions/${promotionId}/group-settings`,
      "PATCH",
      dto,
    );
  }

  @Post("projects/:projectId/promotions/:promotionId/groups/randomize")
  @ApiOperation({ summary: "Randomize groups for a project‑promotion" })
  @ApiParam({ name: "projectId", type: Number })
  @ApiParam({ name: "promotionId", type: Number })
  @ApiOkResponse({ description: "Groups randomized" })
  @HttpCode(HttpStatus.OK)
  async randomizeGroups(
    @Param("projectId", ParseIntPipe) projectId: number,
    @Param("promotionId", ParseIntPipe) promotionId: number,
  ) {
    return this.proxy.forwardRequest(
      "project",
      `/projects/${projectId}/promotions/${promotionId}/groups/randomize`,
      "POST",
    );
  }
}
