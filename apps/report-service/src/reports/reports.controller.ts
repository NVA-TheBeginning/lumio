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
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateReportDto, CreateReportSectionDto, ReportResponseDto, UpdateReportDto } from "./reports.dto";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new report" })
  @ApiResponse({
    status: 201,
    description: "The report has been successfully created.",
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad Request - Invalid input data." })
  async create(@Body() createReportDto: CreateReportDto): Promise<ReportResponseDto> {
    return this.reportsService.create(createReportDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all reports, optionally filtered by project or group" })
  @ApiQuery({ name: "projectId", required: false, type: Number, description: "Filter by project ID" })
  @ApiQuery({ name: "groupId", required: false, type: Number, description: "Filter by group ID" })
  @ApiResponse({
    status: 200,
    description: "List of reports retrieved successfully.",
    type: [ReportResponseDto],
  })
  async findAll(
    @Query("projectId", new ParseIntPipe({ optional: true })) projectId?: number,
    @Query("groupId", new ParseIntPipe({ optional: true })) groupId?: number,
  ): Promise<ReportResponseDto[]> {
    return this.reportsService.findAll(projectId, groupId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a report by ID" })
  @ApiParam({ name: "id", type: Number, description: "Report ID" })
  @ApiResponse({
    status: 200,
    description: "The report has been successfully retrieved.",
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 404, description: "Report not found." })
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<ReportResponseDto> {
    return this.reportsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a report" })
  @ApiParam({ name: "id", type: Number, description: "Report ID" })
  @ApiResponse({
    status: 200,
    description: "The report has been successfully updated.",
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 404, description: "Report not found." })
  @ApiResponse({ status: 400, description: "Bad Request - Invalid input data." })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateReportDto: UpdateReportDto,
  ): Promise<ReportResponseDto> {
    return this.reportsService.update(id, updateReportDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a report" })
  @ApiParam({ name: "id", type: Number, description: "Report ID" })
  @ApiResponse({ status: 204, description: "The report has been successfully deleted." })
  @ApiResponse({ status: 404, description: "Report not found." })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.reportsService.remove(id);
  }

  @Post(":id/sections")
  @ApiOperation({ summary: "Add a section to a report" })
  @ApiParam({ name: "id", type: Number, description: "Report ID" })
  @ApiResponse({
    status: 201,
    description: "The section has been successfully added to the report.",
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 404, description: "Report not found." })
  async addSection(
    @Param("id", ParseIntPipe) id: number,
    @Body() sectionData: CreateReportSectionDto,
  ): Promise<ReportResponseDto> {
    return this.reportsService.addSection(id, sectionData);
  }

  @Patch("sections/:sectionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Update a report section" })
  @ApiParam({ name: "sectionId", type: Number, description: "Section ID" })
  @ApiResponse({ status: 204, description: "The section has been successfully updated." })
  @ApiResponse({ status: 404, description: "Section not found." })
  async updateSection(
    @Param("sectionId", ParseIntPipe) sectionId: number,
    @Body() sectionData: CreateReportSectionDto,
  ): Promise<void> {
    return this.reportsService.updateSection(sectionId, sectionData);
  }

  @Delete("sections/:sectionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a report section" })
  @ApiParam({ name: "sectionId", type: Number, description: "Section ID" })
  @ApiResponse({ status: 204, description: "The section has been successfully deleted." })
  @ApiResponse({ status: 404, description: "Section not found." })
  async removeSection(@Param("sectionId", ParseIntPipe) sectionId: number): Promise<void> {
    return this.reportsService.removeSection(sectionId);
  }
}
