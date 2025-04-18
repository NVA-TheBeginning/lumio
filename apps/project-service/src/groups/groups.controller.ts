import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Put,
} from "@nestjs/common";
import {
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiTags,
} from "@nestjs/swagger";
import {
    CreateGroupDto,
    UpdateGroupDto,
    AddMembersDto,
} from "./dto/group.dto";
import { GroupsService } from "./groups.service";

@ApiTags("groups")
@Controller()
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) {}

    @Post("projects/:projectId/promotions/:promotionId/groups")
    @ApiOperation({ summary: "Create groups skeleton for a project‑promotion" })
    @ApiParam({ name: "projectId", type: Number })
    @ApiParam({ name: "promotionId", type: Number })
    @ApiBody({ type: CreateGroupDto })
    @ApiCreatedResponse({ description: "Group(s) created" })
    async create(
        @Param("projectId", ParseIntPipe) projectId: number,
        @Param("promotionId", ParseIntPipe) promotionId: number,
        @Body() dto: CreateGroupDto
    ) {
        return this.groupsService.create(projectId, promotionId, dto);
    }

    @Get("projects/:projectId/promotions/:promotionId/groups")
    @ApiOperation({ summary: "List all groups for a project‑promotion" })
    @ApiParam({ name: "projectId", type: Number })
    @ApiParam({ name: "promotionId", type: Number })
    @ApiOkResponse({ description: "List of groups" })
    async findAll(
        @Param("projectId", ParseIntPipe) projectId: number,
        @Param("promotionId", ParseIntPipe) promotionId: number
    ) {
        return this.groupsService.findAll(projectId, promotionId);
    }

    @Put("groups/:id")
    @ApiOperation({ summary: "Update a group’s properties" })
    @ApiParam({ name: "id", type: Number })
    @ApiBody({ type: UpdateGroupDto })
    @ApiOkResponse({ description: "Group updated" })
    async update(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateGroupDto
    ) {
        return this.groupsService.update(id, dto);
    }

    @Delete("groups/:id")
    @ApiOperation({ summary: "Delete a group" })
    @ApiParam({ name: "id", type: Number })
    @ApiOkResponse({ description: "Group deleted" })
    async remove(@Param("id", ParseIntPipe) id: number) {
        return this.groupsService.remove(id);
    }

    @Post("groups/:id/students")
    @ApiOperation({ summary: "Add students to a group" })
    @ApiParam({ name: "id", type: Number })
    @ApiBody({ type: AddMembersDto })
    @ApiOkResponse({ description: "Members added" })
    async addMembers(
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: AddMembersDto
    ) {
        return this.groupsService.addMembers(id, dto.studentIds);
    }

    @Delete("groups/:id/students/:userId")
    @ApiOperation({ summary: "Remove one student from a group" })
    @ApiParam({ name: "id", type: Number })
    @ApiParam({ name: "userId", type: Number })
    @ApiOkResponse({ description: "Member removed" })
    async removeMember(
        @Param("id", ParseIntPipe) id: number,
        @Param("userId", ParseIntPipe) userId: number
    ) {
        return this.groupsService.removeMember(id, userId);
    }

    @Get("projects/:projectId/promotions/:promotionId/group-settings")
    @ApiOperation({ summary: "Get group settings for a project‑promotion" })
    @ApiParam({ name: "projectId", type: Number })
    @ApiParam({ name: "promotionId", type: Number })
    @ApiOkResponse({ description: "Current group settings" })
    async getSettings(
        @Param("projectId", ParseIntPipe) projectId: number,
        @Param("promotionId", ParseIntPipe) promotionId: number
    ) {
        return this.groupsService.getSettings(projectId, promotionId);
    }

    @Patch("projects/:projectId/promotions/:promotionId/group-settings")
    @ApiOperation({ summary: "Update group settings" })
    @ApiParam({ name: "projectId", type: Number })
    @ApiParam({ name: "promotionId", type: Number })
    @ApiBody({ type: UpdateGroupDto })  // ou un DTO spécifique pour settings
    @ApiOkResponse({ description: "Settings updated" })
    async updateSettings(
        @Param("projectId", ParseIntPipe) projectId: number,
        @Param("promotionId", ParseIntPipe) promotionId: number,
        @Body() dto: UpdateGroupDto
    ) {
        return this.groupsService.updateSettings(projectId, promotionId, dto);
    }
}
