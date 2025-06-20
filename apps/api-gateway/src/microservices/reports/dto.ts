import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

export class CreateReportSectionDto {
  @ApiProperty({ description: "Section title", maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: "Section content in Markdown format" })
  @IsOptional()
  @IsString()
  contentMarkdown?: string;

  @ApiPropertyOptional({ description: "Section content in HTML format" })
  @IsOptional()
  @IsString()
  contentHtml?: string;
}

export class CreateReportDto {
  @ApiProperty({ description: "Project ID" })
  @IsInt()
  projectId: number;

  @ApiProperty({ description: "Group ID" })
  @IsInt()
  groupId: number;

  @ApiProperty({ description: "Promotion ID" })
  @IsInt()
  promotionId: number;

  @ApiProperty({ description: "Report sections", type: [CreateReportSectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReportSectionDto)
  sections: CreateReportSectionDto[];
}

export class UpdateReportSectionDto {
  @ApiProperty({ description: "Section ID" })
  @IsInt()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: "Section title", maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: "Section content in Markdown format" })
  @IsString()
  contentMarkdown: string;

  @ApiProperty({ description: "Section content in HTML format" })
  @ApiProperty({ nullable: true })
  contentHtml: string | null;
}

export class UpdateReportDto {
  @ApiProperty({ description: "Report sections", type: [UpdateReportSectionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateReportSectionDto)
  sections: UpdateReportSectionDto[];
}

export class ReportSectionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  reportId: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  contentMarkdown: string | null;

  @ApiProperty({ nullable: true })
  contentHtml: string | null;

  @ApiProperty()
  updatedAt: Date;
}

export class ReportResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  projectId: number;

  @ApiProperty({ nullable: true })
  groupId: number | null;

  @ApiProperty()
  submittedAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: [ReportSectionResponseDto] })
  sections: ReportSectionResponseDto[];
}
