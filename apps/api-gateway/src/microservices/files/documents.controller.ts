import { type File, FileInterceptor } from "@nest-lab/fastify-multer";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

@ApiTags("Documents")
@Controller("documents")
export class DocumentController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("upload")
  @ApiOperation({ summary: "Upload a new document" })
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "The file to upload",
        },
        name: {
          type: "string",
          description: "The name of the document",
        },
        userId: {
          type: "number",
          description: "The ID of the user uploading the document",
        },
        projectIds: {
          type: "array",
          items: { type: "number" },
          description: "Optional project IDs to link the document to",
        },
      },
      required: ["file", "name", "userId"],
    },
  })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { preservePath: true }))
  @ApiBadRequestResponse({ description: "Invalid file or user ID provided" })
  async uploadDocument(
    @UploadedFile() file: File,
    @Body("name") name: string,
    @Body("userId") userId: number,
    @Body("projectIds") projectIds?: string,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException("No file uploaded");
    }

    const formData = new FormData();
    formData.append("file", new Blob([file.buffer]), file.originalname);
    formData.append("name", name);
    formData.append("userId", userId.toString());
    formData.append("mimetype", file.mimetype);
    if (projectIds) {
      formData.append("projectIds", projectIds);
    }

    return this.proxy.forwardRequest("files", "/documents/upload", "POST", formData, {
      "Content-Type": "multipart/form-data",
    });
  }

  @Get()
  @ApiOperation({ summary: "Get all documents for a user" })
  @ApiQuery({
    name: "userId",
    type: "number",
    description: "The ID of the user",
  })
  @ApiResponse({
    status: 200,
    description: "List of documents",
  })
  async getDocuments(@Query("userId") userId: number) {
    return this.proxy.forwardRequest("files", `/documents?userId=${userId}`, "GET");
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a document by ID" })
  @ApiParam({ name: "id", type: "number", description: "The ID of the document" })
  @ApiResponse({
    status: 200,
    description: "The requested document",
  })
  @ApiBadRequestResponse({ description: "Invalid document ID" })
  @ApiNotFoundResponse({ description: "Document not found" })
  async getDocument(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("files", `/documents/${id}`, "GET");
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a document by ID" })
  @ApiParam({ name: "id", type: "number", description: "The ID of the document" })
  @ApiResponse({ status: 204, description: "Document deleted successfully" })
  @ApiBadRequestResponse({ description: "Invalid document ID" })
  @ApiNotFoundResponse({ description: "Document not found" })
  async deleteDocument(@Param("id", ParseIntPipe) id: number) {
    return this.proxy.forwardRequest("files", `/documents/${id}`, "DELETE");
  }

  @Post(":id/projects")
  @ApiOperation({ summary: "Link a document to projects" })
  @ApiParam({ name: "id", type: "number", description: "The ID of the document" })
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        projectIds: {
          type: "array",
          items: { type: "number" },
          description: "Project IDs to link the document to",
        },
      },
      required: ["projectIds"],
    },
  })
  @ApiResponse({ status: 200, description: "Document linked to projects successfully" })
  @ApiBadRequestResponse({ description: "Invalid document ID or project IDs" })
  async linkDocumentToProjects(@Param("id", ParseIntPipe) id: number, @Body("projectIds") projectIds: number[]) {
    return this.proxy.forwardRequest("files", `/documents/${id}/projects`, "POST", {
      projectIds,
    });
  }

  @Delete(":id/projects/:projectId")
  @ApiOperation({ summary: "Unlink a document from a project" })
  @ApiParam({ name: "id", type: "number", description: "The ID of the document" })
  @ApiParam({ name: "projectId", type: "number", description: "The ID of the project" })
  @ApiResponse({ status: 200, description: "Document unlinked from project successfully" })
  @ApiBadRequestResponse({ description: "Invalid document ID or project ID" })
  async unlinkDocumentFromProject(
    @Param("id", ParseIntPipe) documentId: number,
    @Param("projectId", ParseIntPipe) projectId: number,
  ) {
    return this.proxy.forwardRequest("files", `/documents/${documentId}/projects/${projectId}`, "DELETE");
  }

  @Get("projects/:projectId")
  @ApiOperation({ summary: "Get all documents for a project" })
  @ApiParam({ name: "projectId", type: "number", description: "The ID of the project" })
  @ApiResponse({
    status: 200,
    description: "List of documents for the project",
  })
  async getDocumentsByProject(@Param("projectId", ParseIntPipe) projectId: number) {
    return this.proxy.forwardRequest("files", `/documents/projects/${projectId}`, "GET");
  }
}
