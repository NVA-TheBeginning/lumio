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
  Res,
  Response,
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
import { DocumentService } from "@/documents/documents.service";

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
  @UseInterceptors(FileInterceptor("file"))
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
  async getDocument(@Param("id", ParseIntPipe) id: number) {
    const document = await this.documentService.getDocumentById(id);

    if (!document) {
      throw new BadRequestException("Document not found");
    }

    return document;
  }

  @Get(":id/download")
  @ApiOperation({ summary: "Download a document by ID" })
  @ApiParam({ name: "id", type: "number", description: "The ID of the document" })
  @ApiResponse({
    status: 200,
    description: "The document file",
    content: {
      "application/octet-stream": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: "Invalid document ID" })
  @ApiNotFoundResponse({ description: "Document not found" })
  async downloadDocument(@Param("id", ParseIntPipe) id: number, @Res() res: Response) {
    const document = await this.documentService.getDocumentById(id);

    if (!document) {
      throw new BadRequestException("Document not found");
    }

    const fileBuffer = await this.documentService.downloadDocument(id);

    res.headers.set("Content-Disposition", `attachment; filename="${document.name}"`);
    res.headers.set("Content-Type", document.mimeType);
    res.headers.set("Content-Length", document.sizeInBytes.toString());
    return fileBuffer;
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
