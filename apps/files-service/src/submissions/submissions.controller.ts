import { type File, FileInterceptor } from "@nest-lab/fastify-multer";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Submissions } from "@prisma-files/client";
import { SubmissionFileResponse, SubmissionsService } from "./submissions.service";

@ApiTags("submissions")
@Controller()
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post("deliverables/:idDeliverable/submit")
  @ApiOperation({ summary: "Submit a deliverable with a ZIP file or Github URL" })
  @ApiResponse({ status: HttpStatus.CREATED, description: "The deliverable has been successfully submitted." })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Invalid input data." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { preservePath: true }))
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "The ZIP file to upload",
        },
        gitUrl: {
          type: "string",
          description: "The URL of the Git repository",
          example: "https://github.com/Jayllyz/sudoku-rust",
        },
        groupId: {
          type: "number",
          description: "The ID of the group submitting the deliverable",
        },
      },
      required: ["groupId"],
    },
  })
  async submit(
    @Param("idDeliverable") idDeliverable: number,
    @Body("groupId") groupId: number,
    @UploadedFile() file?: File,
    @Body("gitUrl") gitUrl?: string,
  ): Promise<Submissions> {
    if (!(file?.buffer || gitUrl)) {
      throw new BadRequestException("Either a file or a Git URL must be provided.");
    }

    return this.submissionsService.submit(idDeliverable, groupId, file?.buffer as Buffer, gitUrl);
  }

  @Get("deliverables/:idDeliverable/submissions")
  @ApiOperation({ summary: "Get all submissions for a deliverable" })
  @ApiResponse({ status: HttpStatus.OK, description: "List of submissions." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async findAllByDeliverable(@Param("idDeliverable") idDeliverable: number): Promise<SubmissionFileResponse[]> {
    return this.submissionsService.findAllSubmissions(Number(idDeliverable));
  }

  @Get("deliverables/:idDeliverable/submissions/:idSubmission")
  @ApiOperation({ summary: "Get a specific submission" })
  @ApiResponse({ status: HttpStatus.OK, description: "Submission details." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Submission not found." })
  async findOne(
    @Param("idDeliverable") idDeliverable: number,
    @Param("idSubmission") idSubmission: number,
  ): Promise<SubmissionFileResponse> {
    return this.submissionsService.findSubmissionById(Number(idDeliverable), Number(idSubmission));
  }

  @Delete("deliverables/:idDeliverable/submissions/:idSubmission")
  @ApiOperation({ summary: "Delete a submission" })
  @ApiResponse({ status: HttpStatus.OK, description: "Submission deleted successfully." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Submission not found." })
  async deleteSubmission(
    @Param("idDeliverable") idDeliverable: number,
    @Param("idSubmission") idSubmission: number,
  ): Promise<void> {
    return this.submissionsService.deleteSubmission(Number(idDeliverable), Number(idSubmission));
  }
}
