import { CacheTTL } from "@nestjs/cache-manager";
import { Body, Controller, Post, UseInterceptors } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";
import { PlagiarismCheckDto } from "./dto/plagiarism-check.dto.js";
import { PlagiarismCacheInterceptor } from "./interceptors/plagiarism-cache.interceptor.js";

@ApiTags("Plagiarism")
@Controller("plagiarism")
export class PlagiarismController {
  constructor(private readonly proxy: MicroserviceProxyService) {}

  @Post("checks")
  @UseInterceptors(PlagiarismCacheInterceptor)
  @CacheTTL(600000)
  @ApiOperation({
    summary: "Downloads, processes, and compares project submissions for plagiarism",
    description:
      "Analyzes project submissions from S3 storage for potential plagiarism using MOSS and Rabin-Karp algorithms. Results are cached for 10 minutes for identical project and promotion combinations.",
  })
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        projectId: {
          type: "string",
          description: "The ID of the project to analyze",
          example: "proj_123",
        },
        promotionId: {
          type: "string",
          description: "The ID of the promotion/class",
          example: "promo_456",
        },
        step: {
          type: "string",
          description: "The step of the project to analyze",
          example: "step_1",
        },
      },
      required: ["projectId", "promotionId", "step"],
    },
  })
  @ApiResponse({
    status: 201,
    description: "Plagiarism analysis completed successfully",
    schema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        promotionId: { type: "string" },
        folderResults: {
          type: "array",
          items: {
            type: "object",
            properties: {
              folderName: { type: "string" },
              sha1: { type: "string", nullable: true },
              plagiarismPercentage: { type: "number" },
              matches: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    matchedFolder: { type: "string" },
                    overallMatchPercentage: { type: "number" },
                    combinedScore: { type: "number" },
                    flags: { type: "array", items: { type: "string" } },
                    fileComparisons: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          fileName: { type: "string" },
                          fileRelativePath: { type: "string" },
                          fileSizeBytes: { type: "number" },
                          linesOfCode: { type: "number" },
                          mossScore: { type: "number" },
                          rabinKarpScore: { type: "number" },
                          combinedScore: { type: "number" },
                          flags: { type: "array", items: { type: "string" } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error during plagiarism analysis",
  })
  async checkPlagiarism(@Body() body: PlagiarismCheckDto) {
    return this.proxy.forwardRequest("plagiarism", "/plagiarism/checks", "POST", body);
  }
}
