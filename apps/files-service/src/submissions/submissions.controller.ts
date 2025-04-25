import { Body, Controller, Get, HttpStatus, Param, Post, Put } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SubmissionsService } from "./submissions.service";

@ApiTags("submissions")
@Controller()
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post("deliverables/:idDeliverable/submit")
  @ApiOperation({ summary: "Submit a deliverable" })
  @ApiResponse({ status: HttpStatus.OK, description: "The deliverable has been successfully submitted." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async submit(@Param("idDeliverable") idDeliverable: string): Promise<void> {
    return this.submissionsService.submit(Number(idDeliverable));
  }

  @Get("deliverables/:idDeliverable/submissions")
  @ApiOperation({ summary: "Get all submissions for a deliverable" })
  @ApiResponse({ status: HttpStatus.OK, description: "Returns all submissions for the deliverable." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async findAll(@Param("idDeliverable") idDeliverable: string): Promise<Deliverables[]> {
    return this.submissionsService.findAllByDeliverable(Number(idDeliverable));
  }

  @Put("submissions/:idSubmission")
  @ApiOperation({ summary: "Update a submission" })
  @ApiResponse({ status: HttpStatus.OK, description: "The submission has been successfully updated." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Submission not found." })
  async update(
    @Param("idSubmission") idSubmission: string,
    @Body() updateSubmissionDto: UpdateDeliverableDto,
  ): Promise<Deliverables> {
    return this.submissionsService.update(idSubmission, updateSubmissionDto);
  }
}
