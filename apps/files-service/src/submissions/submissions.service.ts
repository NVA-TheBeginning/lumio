import { BadRequestException, Injectable } from "@nestjs/common";
import { DeliverableType, SubmissionStatus, Submissions } from "@prisma-files/client";
import * as yauzl from "yauzl";
import { PrismaService } from "@/prisma.service";
import { RuleValidationService } from "@/rules/rule-validation.service";
import { S3Service } from "@/s3.service";

export interface SubmissionMetadataResponse {
  submissionId: number;
  deliverableId: number;
  fileKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  submissionDate: Date;
  groupId: number;
  penalty: number;
  type: DeliverableType[];
  status: string;
  lastModified: Date;
  gitUrl?: string;
  error?: boolean;
}

export interface SubmissionFileResponse {
  submissionId: number;
  deliverableId: number;
  fileKey: string;
  mimeType: string;
  buffer: Buffer;
  submissionDate: Date;
  groupId: number;
  penalty: number;
  type: DeliverableType[];
  status: string;
}

const GIT_URL_REGEX = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(?:(?:\.git)|(?:\/))?$/;

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private ruleValidationService: RuleValidationService,
  ) {}

  async submit(idDeliverable: number, groupId: number, file: Buffer, gitUrl?: string): Promise<Submissions> {
    const deliverable = await this.prisma.deliverables.findUniqueOrThrow({
      where: { id: Number(idDeliverable) },
    });

    const deadline = new Date(deliverable.deadline);
    const now = new Date();

    if (deadline < now && !deliverable.allowLateSubmission) {
      console.warn(
        `Submission for deliverable ${idDeliverable} is late. Deadline was ${deadline.toISOString()}, current time is ${now.toISOString()}`,
      );
      throw new BadRequestException("Submission is not allowed after the deadline");
    }

    let penalty = 0;
    if (deadline < now) {
      const diff = Math.abs(deadline.getTime() - now.getTime());
      const diffHours = Math.ceil(diff / (1000 * 3600));
      if (diffHours > 0) {
        penalty = Math.min(diffHours, 100);
      }
    }

    let key: string | undefined;
    if (gitUrl && deliverable.type.includes(DeliverableType.GIT)) {
      // https://github.com/username/reponame(.git)
      // .git is optional so some students may add it
      if (!GIT_URL_REGEX.test(gitUrl)) {
        throw new BadRequestException("Invalid Git URL format");
      }
      const username = gitUrl.split("/").slice(-2, -1)[0];
      const repoName = gitUrl.split("/").slice(-1)[0].replace(".git", "");
      key = await this.s3Service.uploadGitSubmission(
        username,
        repoName,
        groupId,
        deliverable.projectId,
        deliverable.promotionId,
        idDeliverable,
      );
    } else if (file && deliverable.type.includes(DeliverableType.FILE)) {
      const containsForbiddenFiles = await this.checkForbiddenFiles(file);
      if (containsForbiddenFiles) {
        throw new BadRequestException("ZIP is invalid or contains forbidden files");
      }

      // Validate submission against deliverable rules
      const ruleValidationResult = await this.ruleValidationService.validateSubmission(idDeliverable, file);
      if (!ruleValidationResult.isValid) {
        const errorMessage = `Submission does not meet the required rules:\n${ruleValidationResult.errors.join("\n")}`;
        throw new BadRequestException(errorMessage);
      }

      key = await this.s3Service.uploadZipSubmission(
        file,
        groupId,
        deliverable.projectId,
        deliverable.promotionId,
        idDeliverable,
      );
    } else {
      throw new BadRequestException("Invalid submission type");
    }

    const created = await this.prisma.submissions.create({
      data: {
        deliverableId: idDeliverable,
        status: penalty > 0 ? SubmissionStatus.LATE : SubmissionStatus.PENDING,
        groupId,
        penalty,
        fileUrl: key,
        gitUrl: gitUrl ?? undefined,
      },
    });

    return created;
  }

  private async checkForbiddenFiles(fileBuffer: Buffer): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      yauzl.fromBuffer(fileBuffer, { lazyEntries: true }, (err, zipfile) => {
        if (err || !zipfile) {
          reject(new BadRequestException("Invalid zip file"));
          return;
        }

        let hasDll = false;
        let isResolved = false;

        zipfile.on("entry", (entry) => {
          if (entry.fileName.toLowerCase().endsWith(".dll")) {
            hasDll = true;
            zipfile.close();
            if (!isResolved) {
              isResolved = true;
              resolve(true);
            }
            return;
          }
          zipfile.readEntry();
        });

        zipfile.on("end", () => {
          if (!isResolved) {
            isResolved = true;
            resolve(hasDll);
          }
        });

        zipfile.on("error", (_err) => {
          if (!isResolved) {
            isResolved = true;
            reject(new BadRequestException("Invalid zip file"));
          }
        });

        zipfile.readEntry();
      });
    });
  }

  async findAllGroupSubmissions(groupId: number, idDeliverable?: number): Promise<SubmissionMetadataResponse[]> {
    const submissions = await this.prisma.submissions.findMany({
      where: {
        groupId,
        ...(idDeliverable && { deliverableId: idDeliverable }),
        fileUrl: { not: null },
      },
      orderBy: { submissionDate: "desc" },
      include: {
        deliverable: {
          select: { type: true },
        },
      },
    });

    if (submissions.length === 0) {
      return [];
    }

    const BATCH_SIZE = submissions.length < 5 ? submissions.length : 5;

    const batchPromises = [];
    for (let i = 0; i < submissions.length; i += BATCH_SIZE) {
      const batch = submissions.slice(i, i + BATCH_SIZE);

      const batchPromise = Promise.allSettled(
        batch.map(async (submission): Promise<SubmissionMetadataResponse> => {
          if (!submission.fileUrl) {
            throw new BadRequestException(`File URL is missing for submission ${submission.id}`);
          }
          const metadata = await this.s3Service.getFileMetadata(submission.fileUrl);
          return {
            submissionId: submission.id,
            deliverableId: submission.deliverableId,
            fileKey: submission.fileUrl,
            fileName: this.extractFileName(submission.fileUrl),
            mimeType: metadata.contentType,
            fileSize: metadata.size,
            submissionDate: submission.submissionDate,
            groupId: submission.groupId,
            penalty: Number(submission.penalty),
            type: submission.deliverable.type,
            status: submission.status,
            gitUrl: submission.gitUrl || undefined,
            lastModified: metadata.lastModified,
          };
        }),
      ).then((batchResults) => ({ batchResults, batch }));

      batchPromises.push(batchPromise);
    }

    const allBatchResults = await Promise.all(batchPromises);

    const results: SubmissionMetadataResponse[] = [];

    allBatchResults.forEach(({ batchResults, batch }) => {
      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          const submission = batch[index];
          results.push({
            submissionId: submission.id,
            deliverableId: submission.deliverableId,
            fileKey: "",
            fileName: "",
            mimeType: "application/zip",
            fileSize: 0,
            submissionDate: submission.submissionDate,
            groupId: submission.groupId,
            penalty: Number(submission.penalty),
            type: submission.deliverable.type,
            status: submission.status,
            lastModified: submission.submissionDate,
            error: true,
          });
        }
      });
    });

    return results;
  }

  async findAllPromotionSubmissions(promotionId: number, projectId?: number): Promise<SubmissionMetadataResponse[]> {
    const submissions = await this.prisma.submissions.findMany({
      where: {
        deliverable: {
          promotionId,
          ...(projectId && { projectId }),
        },
        fileUrl: { not: null },
      },
      orderBy: { submissionDate: "desc" },
      include: {
        deliverable: {
          select: {
            type: true,
            name: true,
            projectId: true,
            promotionId: true,
          },
        },
      },
    });

    if (submissions.length === 0) {
      return [];
    }

    const BATCH_SIZE = submissions.length < 5 ? submissions.length : 5;

    const batchPromises = [];
    for (let i = 0; i < submissions.length; i += BATCH_SIZE) {
      const batch = submissions.slice(i, i + BATCH_SIZE);

      const batchPromise = Promise.allSettled(
        batch.map(async (submission): Promise<SubmissionMetadataResponse> => {
          if (!submission.fileUrl) {
            throw new BadRequestException(`File URL is missing for submission ${submission.id}`);
          }
          const metadata = await this.s3Service.getFileMetadata(submission.fileUrl);
          return {
            submissionId: submission.id,
            deliverableId: submission.deliverableId,
            fileKey: submission.fileUrl,
            fileName: this.extractFileName(submission.fileUrl),
            mimeType: metadata.contentType,
            fileSize: metadata.size,
            submissionDate: submission.submissionDate,
            groupId: submission.groupId,
            penalty: Number(submission.penalty),
            type: submission.deliverable.type,
            status: submission.status,
            gitUrl: submission.gitUrl || undefined,
            lastModified: metadata.lastModified,
          };
        }),
      ).then((batchResults) => ({ batchResults, batch }));

      batchPromises.push(batchPromise);
    }

    const allBatchResults = await Promise.all(batchPromises);

    const results: SubmissionMetadataResponse[] = [];

    allBatchResults.forEach(({ batchResults, batch }) => {
      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          const submission = batch[index];
          results.push({
            submissionId: submission.id,
            deliverableId: submission.deliverableId,
            fileKey: "",
            fileName: "",
            mimeType: "application/zip",
            fileSize: 0,
            submissionDate: submission.submissionDate,
            groupId: submission.groupId,
            penalty: Number(submission.penalty),
            type: submission.deliverable.type,
            status: submission.status,
            lastModified: submission.submissionDate,
            error: true,
          });
        }
      });
    });

    return results;
  }

  async downloadSubmissionFile(submissionId: number): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const submission = await this.prisma.submissions.findUniqueOrThrow({
      where: { id: submissionId },
      select: {
        fileUrl: true,
      },
    });

    if (!submission.fileUrl) {
      throw new BadRequestException("File URL is missing for submission");
    }

    try {
      const buffer = await this.s3Service.getFile(submission.fileUrl);
      const fileName = this.extractFileName(submission.fileUrl);

      return {
        buffer,
        fileName,
        mimeType: "application/zip",
      };
    } catch (error) {
      console.error(`Failed to download file for submission ${submissionId}:`, error);
      throw new BadRequestException("File not found for submission");
    }
  }

  private extractFileName(fileUrl: string): string {
    const fileName = fileUrl.split("/").pop() || "submission.zip";
    return fileName;
  }

  async deleteSubmission(idSubmission: number): Promise<void> {
    const submission = await this.prisma.submissions.findUniqueOrThrow({
      where: { id: Number(idSubmission) },
    });

    if (submission?.fileUrl) {
      await this.s3Service.deleteFile(submission.fileUrl);
    }
    await this.prisma.submissions.delete({
      where: { id: Number(idSubmission) },
    });
  }

  async acceptSubmission(submissionId: number): Promise<Submissions> {
    const submission = await this.prisma.submissions.findUniqueOrThrow({
      where: { id: submissionId },
    });

    if (submission.status === SubmissionStatus.ACCEPTED) {
      throw new BadRequestException("Submission is already accepted");
    }

    return this.prisma.submissions.update({
      where: { id: submissionId },
      data: { status: SubmissionStatus.ACCEPTED },
    });
  }

  async validateSubmissionRules(
    deliverableId: number,
    fileBuffer: Buffer,
  ): Promise<{ isValid: boolean; errors: string[] }> {
    return this.ruleValidationService.validateSubmission(deliverableId, fileBuffer);
  }
}
