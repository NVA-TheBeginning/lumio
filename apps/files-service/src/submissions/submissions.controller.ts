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
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Submissions } from "@prisma-files/client";
import { SubmissionMetadataResponse, SubmissionsService } from "./submissions.service";

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
  @UseInterceptors(
    FileInterceptor("file", {
      preservePath: true,
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  )
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

    return this.submissionsService.submit(Number(idDeliverable), Number(groupId), file?.buffer as Buffer, gitUrl);
  }

  @Get("deliverables/:groupId/submissions")
  @ApiQuery({
    name: "idDeliverable",
    required: false,
    type: Number,
    description: "Filter submissions by deliverable ID",
  })
  @ApiOperation({ summary: "Get all submissions for a group" })
  @ApiResponse({ status: HttpStatus.OK, description: "List of submissions." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async findAllByDeliverable(
    @Param("groupId") groupId: number,
    @Query("idDeliverable") idDeliverable?: number,
  ): Promise<SubmissionMetadataResponse[]> {
    return await this.submissionsService.findAllGroupSubmissions(Number(groupId), Number(idDeliverable));
  }

  @Get("submissions/:promotionId/submissions")
  @ApiQuery({
    name: "projectId",
    required: false,
    type: Number,
    description: "Filter submissions by project ID",
  })
  @ApiOperation({ summary: "Get all submissions for a promotion (all groups)" })
  @ApiResponse({ status: HttpStatus.OK, description: "List of all submissions for the promotion." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Promotion not found." })
  async findAllPromotionSubmissions(
    @Param("promotionId") promotionId: number,
    @Query("projectId") projectId?: number,
  ): Promise<SubmissionMetadataResponse[]> {
    return await this.submissionsService.findAllPromotionSubmissions(Number(promotionId), Number(projectId));
  }

  @Get("submissions/:idSubmission/download")
  @ApiOperation({ summary: "Get a specific submission" })
  @ApiResponse({ status: HttpStatus.OK, description: "Submission details." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Submission not found." })
  async findOne(
    @Param("idSubmission") idSubmission: number,
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    return this.submissionsService.downloadSubmissionFile(Number(idSubmission));
  }

  @Delete("submissions/:idSubmission")
  @ApiOperation({ summary: "Delete a submission" })
  @ApiResponse({ status: HttpStatus.OK, description: "Submission deleted successfully." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Submission not found." })
  async deleteSubmission(@Param("idSubmission") idSubmission: number): Promise<void> {
    return this.submissionsService.deleteSubmission(Number(idSubmission));
  }
}
