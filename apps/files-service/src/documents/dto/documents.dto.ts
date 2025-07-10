import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UploadDocumentDto {
  @ApiProperty({ description: "Document name" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: "User ID (owner)" })
  @IsInt()
  @Type(() => Number)
  userId: number;

  @ApiPropertyOptional({
    description: "Project IDs to link the document to",
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  @IsOptional()
  projectIds?: number[];
}

export class LinkDocumentToProjectsDto {
  @ApiProperty({
    description: "Project IDs to link the document to",
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  projectIds: number[];
}

export class DocumentIdParams {
  @ApiProperty({ description: "Document ID" })
  @IsInt()
  @Type(() => Number)
  id: number;
}

export class ProjectIdParams {
  @ApiProperty({ description: "Project ID" })
  @IsInt()
  @Type(() => Number)
  projectId: number;
}
