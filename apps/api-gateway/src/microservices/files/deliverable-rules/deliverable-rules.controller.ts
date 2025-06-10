import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { CreateDeliverableRuleDto, RuleIdParam, UpdateDeliverableRuleDto } from "./dto.js";

@ApiTags("deliverable-rules")
@Controller()
export class DeliverableRulesController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("deliverables/rules")
  @ApiOperation({ summary: "Create a new rule for a deliverable" })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The rule has been successfully created." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async create(@Body() createRuleDto: CreateDeliverableRuleDto) {
    return this.proxy.forwardRequest("files", "/deliverables/rules", "POST", createRuleDto);
  }

  @Get("deliverables/:deliverableId/rules")
  @ApiOperation({ summary: "Get all rules for a deliverable" })
  @ApiResponse({ status: HttpStatus.OK, description: "Returns all rules for the deliverable." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async findAll(@Param("deliverableId", ParseIntPipe) deliverableId: number) {
    return this.proxy.forwardRequest("files", `/deliverables/${deliverableId}/rules`, "GET");
  }

  @Get("rules/:id")
  @ApiOperation({ summary: "Get a rule by ID" })
  @ApiResponse({ status: HttpStatus.OK, description: "Returns the rule." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Rule not found." })
  async findOne(@Param() params: RuleIdParam) {
    return this.proxy.forwardRequest("files", `/rules/${params.id}`, "GET");
  }

  @Put("rules/:id")
  @ApiOperation({ summary: "Update a rule" })
  @ApiResponse({ status: HttpStatus.OK, description: "The rule has been successfully updated." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Rule not found." })
  async update(@Param("id", ParseIntPipe) id: number, @Body() updateRuleDto: UpdateDeliverableRuleDto) {
    return this.proxy.forwardRequest("files", `/rules/${id}`, "PUT", updateRuleDto);
  }

  @Delete("rules/:id")
  @ApiOperation({ summary: "Delete a rule" })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: "The rule has been successfully deleted." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Rule not found." })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.proxy.forwardRequest("files", `/rules/${id}`, "DELETE");
  }
}
