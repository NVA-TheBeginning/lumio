import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma.service";
import { S3Service } from "@/s3.service";

@Injectable()
export class SubmissionsService {
  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}

  /**
   * Submit a deliverable
   * @param idDeliverable The deliverable ID
   * @returns void
   */
  async submit(idDeliverable: number, groupId: string, file: Buffer): Promise<string> {
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

    await this.prisma.submissions.create({
      data: {
        deliverableId: idDeliverable,
        status: "PENDING",
        groupId: Number(groupId),
        penalty: hoursDiff > 0 ? Math.floor(hoursDiff) : 0,
        fileUrl: key,
      },
    });

    return key;
  }

  // /**
  //  * Find all submissions for a deliverable
  //  * @param idDeliverable The deliverable ID
  //  * @returns Array of submissions
  //  */
  // async findAllByDeliverable(idDeliverable: number): Promise<Submission[]> {
  //   const deliverable = await this.prisma.deliverables.findUnique({
  //     where: { id: idDeliverable },
  //   });

  //   if (!deliverable) {
  //     throw new NotFoundException(`Deliverable with ID ${idDeliverable} not found`);
  //   }

  //   return this.prisma.submissions.findMany({
  //     where: { deliverableId: idDeliverable },
  //     orderBy: { submissionDate: "desc" },
  //   });
  // }
}
