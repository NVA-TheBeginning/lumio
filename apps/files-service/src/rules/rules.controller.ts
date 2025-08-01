import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { DeliverablesRules } from "@prisma-files/client";
import { CreateDeliverableRuleDto, RuleIdParam, UpdateDeliverableRuleDto } from "@/rules/dto/rules.dto";
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

  @Get("deliverables/:deliverableId/rules")
  @ApiOperation({ summary: "Get all rules for a deliverable" })
  @ApiResponse({ status: HttpStatus.OK, description: "Returns all rules for the deliverable." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async findAll(@Param("deliverableId", ParseIntPipe) deliverableId: number): Promise<DeliverablesRules[]> {
    return this.deliverableRulesService.findAllByDeliverable(deliverableId);
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
    @Param("id", ParseIntPipe) id: number,
    @Body() updateRuleDto: UpdateDeliverableRuleDto,
  ): Promise<DeliverablesRules> {
    return this.deliverableRulesService.update(id, updateRuleDto);
  }

  @Delete("rules/:id")
  @ApiOperation({ summary: "Delete a rule" })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: "The rule has been successfully deleted." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Rule not found." })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.deliverableRulesService.remove(id);
  }
}
