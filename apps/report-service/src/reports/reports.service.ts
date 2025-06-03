import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma-report";
import { PrismaService } from "@/prisma.service.js";
import { CreateReportDto, ReportResponseDto, UpdateReportDto } from "./reports.dto.js";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReportDto: CreateReportDto): Promise<ReportResponseDto> {
    if (!(createReportDto.projectId && createReportDto.groupId && createReportDto.promotionId)) {
      throw new BadRequestException("projectId, groupId, and promotionId are required");
    }
    const report = await this.prisma.report.create({
      data: {
        projectId: createReportDto.projectId,
        groupId: createReportDto.groupId,
        promotionId: createReportDto.promotionId,
        sections: {
          create: createReportDto.sections.map((section) => ({
            title: section.title,
            contentMarkdown: section.contentMarkdown,
            contentHtml: section.contentHtml,
          })),
        },
      },
      include: {
        sections: true,
      },
    });

    if (!report) {
      throw new BadRequestException("Failed to create report");
    }

    return report;
  }

  async findAll(projectId?: number, groupId?: number, promotionId?: number): Promise<ReportResponseDto[]> {
    const where: Prisma.ReportWhereInput = {};

    if (projectId !== undefined) {
      where.projectId = projectId;
    }

    if (groupId !== undefined) {
      where.groupId = groupId;
    }

    if (promotionId !== undefined) {
      where.promotionId = promotionId;
    }

    return await this.prisma.report.findMany({
      where,
      include: {
        sections: {
          orderBy: { id: "asc" },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  async findOne(id: number): Promise<ReportResponseDto> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return report;
  }

  async update(id: number, updateReportDto: UpdateReportDto): Promise<ReportResponseDto> {
    const existingReport = await this.prisma.report.findUnique({
      where: { id },
      include: { sections: true },
    });

    if (!existingReport) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    try {
      const { sections } = updateReportDto;

      if (!sections || sections.length === 0) {
        return existingReport;
      }

      const updatedReport = await this.prisma.$transaction(async (prisma) => {
        await prisma.reportSection.deleteMany({
          where: { reportId: id },
        });

        if (sections.length > 0) {
          await prisma.reportSection.createMany({
            data: sections.map((section) => ({
              reportId: id,
              title: section.title,
              contentMarkdown: section.contentMarkdown,
              contentHtml: section.contentHtml,
            })),
          });
        }

        return prisma.report.findUnique({
          where: { id },
          include: {
            sections: {
              orderBy: { id: "asc" },
            },
          },
        });
      });

      if (!updatedReport) {
        throw new Error("Failed to retrieve updated report");
      }

      return updatedReport;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case "P2003":
            throw new BadRequestException("Invalid projectId or groupId provided");
          default:
            throw new BadRequestException(`Database error: ${error.message}`);
        }
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const existingReport = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!existingReport) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    await this.prisma.report.delete({
      where: { id },
    });
  }

  async addSection(
    reportId: number,
    sectionData: { title: string; contentMarkdown?: string; contentHtml?: string },
  ): Promise<ReportResponseDto> {
    const existingReport = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!existingReport) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    await this.prisma.reportSection.create({
      data: {
        reportId,
        title: sectionData.title,
        contentMarkdown: sectionData.contentMarkdown,
        contentHtml: sectionData.contentHtml,
      },
    });

    return this.findOne(reportId);
  }

  async updateSection(
    sectionId: number,
    sectionData: { title?: string; contentMarkdown?: string; contentHtml?: string },
  ): Promise<void> {
    const existingSection = await this.prisma.reportSection.findUnique({
      where: { id: sectionId },
    });

    if (!existingSection) {
      throw new NotFoundException(`Report section with ID ${sectionId} not found`);
    }

    await this.prisma.reportSection.update({
      where: { id: sectionId },
      data: {
        ...(sectionData.title !== undefined && { title: sectionData.title }),
        ...(sectionData.contentMarkdown !== undefined && { contentMarkdown: sectionData.contentMarkdown }),
        ...(sectionData.contentHtml !== undefined && { contentHtml: sectionData.contentHtml }),
      },
    });
  }

  async removeSection(sectionId: number): Promise<void> {
    const existingSection = await this.prisma.reportSection.findUnique({
      where: { id: sectionId },
    });

    if (!existingSection) {
      throw new NotFoundException(`Report section with ID ${sectionId} not found`);
    }

    await this.prisma.reportSection.delete({
      where: { id: sectionId },
    });
  }
}
