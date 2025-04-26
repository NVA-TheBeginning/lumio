import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Submissions } from "@prisma-files/client";
import { PrismaService } from "@/prisma.service";
import { S3Service } from "@/s3.service";

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  async submit(idDeliverable: number, groupId: string, file: Buffer): Promise<Submissions> {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: { id: idDeliverable },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${idDeliverable} not found`);
    }

    if (deliverable?.allowLateSubmission === false) {
      throw new BadRequestException("Late submission is not allowed for this deliverable");
    }

    const deadline = new Date(deliverable.deadline);
    const now = new Date();
    const hoursDiff = Math.abs(deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    const key = await this.s3Service.uploadZipSubmission(
      file,
      groupId,
      deliverable.projectId,
      deliverable.promotionId,
      idDeliverable,
    );

    const created = await this.prisma.submissions.create({
      data: {
        deliverableId: idDeliverable,
        status: "PENDING",
        groupId: Number(groupId),
        penalty: hoursDiff > 0 ? Math.floor(hoursDiff) : 0,
        fileUrl: key,
      },
    });

    return created;
  }

  async findAllByDeliverable(idDeliverable: number): Promise<Submissions[]> {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: { id: idDeliverable },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${idDeliverable} not found`);
    }

    return this.prisma.submissions.findMany({
      where: { deliverableId: idDeliverable },
      orderBy: { submissionDate: "desc" },
    });
  }

  async deleteSubmission(idDeliverable: number, idSubmission: number): Promise<void> {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: { id: idDeliverable },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${idDeliverable} not found`);
    }

    const submission = await this.prisma.submissions.findUnique({
      where: { id: idSubmission },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${idSubmission} not found`);
    }

    if (submission?.fileUrl) {
      await this.s3Service.deleteFile(submission.fileUrl);
    }
    await this.prisma.submissions.delete({
      where: { id: idSubmission },
    });
  }
}
