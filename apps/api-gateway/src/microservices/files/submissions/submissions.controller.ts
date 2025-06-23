import { type File, FileInterceptor } from "@nest-lab/fastify-multer";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

@ApiTags("submissions")
@Controller()
export class SubmissionsController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

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
    @Param("idDeliverable", ParseIntPipe) idDeliverable: number,
    @Body() body: { groupId: string; gitUrl?: string },
    @UploadedFile() file?: File,
  ) {
    const groupId = parseInt(body.groupId, 10);

    if (Number.isNaN(groupId)) {
      throw new BadRequestException("groupId must be a valid number");
    }

    if (!(file?.buffer || body.gitUrl)) {
      throw new BadRequestException("Either a file or a Git URL must be provided.");
    }

    const formData = new FormData();
    formData.append("groupId", groupId.toString());

    if (file?.buffer) {
      const fileBlob = new Blob([file.buffer], { type: file.mimetype });
      formData.append("file", fileBlob, file.originalname);
    }

    if (body.gitUrl) {
      formData.append("gitUrl", body.gitUrl);
    }

    return await this.proxy.forwardRequest("files", `/deliverables/${idDeliverable}/submit`, "POST", formData);
  }

  @Get("deliverables/:groupId/submissions")
  @ApiOperation({ summary: "Get all submissions for a group" })
  @ApiQuery({
    name: "idDeliverable",
    required: false,
    type: Number,
    description: "Filter submissions by deliverable ID",
  })
  @ApiResponse({ status: HttpStatus.OK, description: "List of submissions." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Deliverable not found." })
  async findAllByDeliverable(@Param("groupId") groupId: number, @Query("idDeliverable") idDeliverable?: number) {
    if (idDeliverable) {
      return await this.proxy.forwardRequest(
        "files",
        `/deliverables/${groupId}/submissions?idDeliverable=${idDeliverable}`,
        "GET",
      );
    }
    return await this.proxy.forwardRequest("files", `/deliverables/${groupId}/submissions`, "GET");
  }

  @Get("submissions/:idSubmission/download")
  @ApiOperation({ summary: "Download a specific submission file" })
  @ApiResponse({ status: HttpStatus.OK, description: "Submission file download." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Submission not found." })
  async findOne(@Param("idSubmission") idSubmission: number) {
    return await this.proxy.forwardRequest("files", `/submissions/${idSubmission}/download`, "GET");
  }

  @Get("promotions/:promotionId/submissions")
  @ApiQuery({
    name: "projectId",
    required: false,
    type: Number,
    description: "Filter submissions by project ID",
  })
  @ApiOperation({ summary: "Get all submissions for a promotion (all groups)" })
  @ApiResponse({ status: HttpStatus.OK, description: "List of all submissions for the promotion." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Promotion not found." })
  async findAllPromotionSubmissions(@Param("promotionId") promotionId: number, @Query("projectId") projectId?: number) {
    if (projectId) {
      return await this.proxy.forwardRequest(
        "files",
        `/submissions/${promotionId}/submissions?projectId=${projectId}`,
        "GET",
      );
    }
    return await this.proxy.forwardRequest("files", `/submissions/${promotionId}/submissions`, "GET");
  }

  @Delete("submissions/:idSubmission")
  @ApiOperation({ summary: "Delete a submission" })
  @ApiResponse({ status: HttpStatus.OK, description: "Submission deleted successfully." })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: "Submission not found." })
  async deleteSubmission(@Param("idSubmission") idSubmission: number): Promise<void> {
    return await this.proxy.forwardRequest("files", `/submissions/${idSubmission}`, "DELETE");
  }
}
