import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DeliverableType, Submissions } from "@prisma-files/client";
import * as yauzl from "yauzl";
import { PrismaService } from "@/prisma.service";
import { S3Service } from "@/s3.service";

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
  ) {}

  async submit(idDeliverable: number, groupId: number, file: Buffer, gitUrl?: string): Promise<Submissions> {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: { id: Number(idDeliverable) },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${idDeliverable} not found`);
    }

    if (deliverable?.allowLateSubmission === false) {
      throw new BadRequestException("Late submission is not allowed for this deliverable");
    }

    const deadline = new Date(deliverable.deadline);
    const now = new Date();
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
        status: penalty > 0 ? "LATE" : "PASSED",
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

  async findAllSubmissions(idDeliverable: number): Promise<SubmissionFileResponse[]> {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: { id: Number(idDeliverable) },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${idDeliverable} not found`);
    }

    const submissions = await this.prisma.submissions.findMany({
      where: { deliverableId: idDeliverable },
      orderBy: { submissionDate: "desc" },
    });

    const submissionFileResponses: SubmissionFileResponse[] = [];
    await Promise.all(
      submissions.map(async (submission) => {
        try {
          if (!submission.fileUrl) {
            throw new BadRequestException("File URL is missing for submission");
          }
          const file = await this.s3Service.getFile(submission.fileUrl);
          submissionFileResponses.push({
            submissionId: submission.id,
            deliverableId: idDeliverable,
            fileKey: submission.fileUrl,
            mimeType: "application/zip",
            buffer: file,
            submissionDate: submission.submissionDate,
            groupId: submission.groupId,
            penalty: Number(submission.penalty),
            type: deliverable.type,
            status: submission.status,
          });
        } catch (error) {
          console.error(`Failed to retrieve file for submission ${submission.id}:`, error);
          throw new BadRequestException("File not found for submission");
        }
      }),
    );

    return submissionFileResponses;
  }

  async findSubmissionById(idDeliverable: number, idSubmission: number): Promise<SubmissionFileResponse> {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: { id: Number(idDeliverable) },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${idDeliverable} not found`);
    }

    const submission = await this.prisma.submissions.findUnique({
      where: { id: Number(idSubmission) },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${idSubmission} not found`);
    }

    if (!submission.fileUrl) {
      throw new BadRequestException("File URL is missing for submission");
    }

    const file = await this.s3Service.getFile(submission.fileUrl);

    return {
      submissionId: submission.id,
      deliverableId: idDeliverable,
      fileKey: submission.fileUrl,
      mimeType: "application/zip",
      buffer: file,
      submissionDate: submission.submissionDate,
      groupId: submission.groupId,
      penalty: Number(submission.penalty),
      type: deliverable.type,
      status: submission.status,
    };
  }

  async deleteSubmission(idDeliverable: number, idSubmission: number): Promise<void> {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: { id: Number(idDeliverable) },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${idDeliverable} not found`);
    }

    const submission = await this.prisma.submissions.findUnique({
      where: { id: Number(idSubmission) },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${idSubmission} not found`);
    }

    if (submission?.fileUrl) {
      await this.s3Service.deleteFile(submission.fileUrl);
    }
    await this.prisma.submissions.delete({
      where: { id: Number(idSubmission) },
    });
  }
}
