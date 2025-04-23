import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DeliverablesRules } from "@prisma-files/client";
import {
  CreateDeliverableRuleDto,
  DeliverableIdParam,
  RuleIdParam,
  UpdateDeliverableRuleDto,
} from "@/rules/dto/rules.dto";
import { DeliverableRulesService } from "@/rules/rules.service";

@ApiTags("deliverable-rules")
@Controller()
export class DeliverableRulesController {
  constructor(private readonly deliverableRulesService: DeliverableRulesService) {}

  @Post("deliverables/rules")
  @ApiOperation({ summary: "Create a new rule for a deliverable" })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The rule has been successfully created." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async create(@Body() createRuleDto: CreateDeliverableRuleDto): Promise<DeliverablesRules> {
    return this.deliverableRulesService.create(createRuleDto);
  }

  @Get("deliverables/rules/:projectId/:promotionId")
  @ApiOperation({ summary: "Get all rules for a project/promo" })
  @ApiResponse({ status: HttpStatus.OK, description: "Returns all rules for the deliverable." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async findAll(@Param() params: DeliverableIdParam): Promise<DeliverablesRules[]> {
    return this.deliverableRulesService.findAllByProjectPromo(Number(params.projectId), Number(params.promotionId));
  }

  @Get("rules/:id")
  @ApiOperation({ summary: "Get a rule by ID" })
  @ApiResponse({ status: HttpStatus.OK, description: "Returns the rule." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Rule not found." })
  async findOne(@Param() params: RuleIdParam): Promise<DeliverablesRules> {
    return this.deliverableRulesService.findOne(Number(params.id));
  }

  @Put("rules/:id")
  @ApiOperation({ summary: "Update a rule" })
  @ApiResponse({ status: HttpStatus.OK, description: "The rule has been successfully updated." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Rule not found." })
  async update(
    @Param() params: RuleIdParam,
    @Body() updateRuleDto: UpdateDeliverableRuleDto,
  ): Promise<DeliverablesRules> {
    return this.deliverableRulesService.update(Number(params.id), updateRuleDto);
  }

  @Delete("rules/:id")
  @ApiOperation({ summary: "Delete a rule" })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: "The rule has been successfully deleted." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Rule not found." })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: RuleIdParam): Promise<void> {
    return this.deliverableRulesService.remove(Number(params.id));
  }
}
