import { type File, FileInterceptor } from "@nest-lab/fastify-multer";
import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SubmissionsService } from "./submissions.service";

@ApiTags("submissions")
@Controller()
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post("deliverables/:idDeliverable/submit")
  @ApiOperation({ summary: "Submit a deliverable with a ZIP file" })
  @ApiResponse({ status: HttpStatus.OK, description: "The deliverable has been successfully submitted." })
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
        groupId: {
          type: "string",
          description: "The ID of the group submitting the deliverable",
        },
      },
      required: ["file", "groupId"],
    },
  })
  async submit(
    @Param("idDeliverable") idDeliverable: string,
    @Body("groupId") groupId: string,
    @UploadedFile() file: File,
  ): Promise<string> {
    if (!file?.buffer) {
      throw new BadRequestException("No file uploaded");
    }

    return this.submissionsService.submit(Number(idDeliverable), groupId, file.buffer);
  }
}
