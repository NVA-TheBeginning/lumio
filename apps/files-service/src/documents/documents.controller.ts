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
import { DocumentService, GetDocumentResponse } from "@/documents/documents.service";

@ApiTags("Documents")
@Controller("documents")
export class DocumentController {
  constructor(private documentService: DocumentService) {}

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
      },
      required: ["file", "name", "userId"],
    },
  })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { preservePath: true }))
  @ApiBadRequestResponse({ description: "Invalid file or user ID provided" })
  async uploadDocument(@UploadedFile() file: File, @Body("name") name: string, @Body("userId") userId: number) {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    return this.documentService.uploadDocument(file, name, userId);
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
    return this.documentService.getDocumentsByOwner(userId);
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
  async getDocument(@Param("id", ParseIntPipe) id: number): Promise<GetDocumentResponse> {
    const document = await this.documentService.getDocumentById(id);

    if (!document) {
      throw new BadRequestException("Document not found");
    }

    return document;
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a document by ID" })
  @ApiParam({ name: "id", type: "number", description: "The ID of the document" })
  @ApiResponse({ status: 204, description: "Document deleted successfully" })
  @ApiBadRequestResponse({ description: "Invalid document ID" })
  @ApiNotFoundResponse({ description: "Document not found" })
  async deleteDocument(@Param("id", ParseIntPipe) id: number) {
    return this.documentService.deleteDocument(id);
  }
}
