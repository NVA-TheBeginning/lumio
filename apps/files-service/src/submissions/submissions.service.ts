import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Deliverable, Submission } from "@prisma/client";
import { PrismaService } from "@/prisma.service";
import { S3Service } from "@/s3.service";

// Define the missing DTOs based on the controller
interface UpdateSubmissionDto {
  status?: string;
  feedback?: string;
  grade?: number;
  s3Key?: string;
}

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
  async submit(idDeliverable: number): Promise<void> {
    const deliverable = await this.prisma.deliverables.findUnique({
      where: { id: idDeliverable },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${idDeliverable} not found`);
    }

    // Create a submission record
    await this.prisma.submissions.create({
      data: {
        deliverableId: idDeliverable,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
  }

  /**
   * Find all submissions for a deliverable
   * @param idDeliverable The deliverable ID
   * @returns Array of submissions
   */
  async findAllByDeliverable(idDeliverable: number): Promise<Submission[]> {
    // Check if deliverable exists
    const deliverable = await this.prisma.deliverables.findUnique({
      where: { id: idDeliverable },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable with ID ${idDeliverable} not found`);
    }

    // Get all submissions for this deliverable
    return this.prisma.submissions.findMany({
      where: { deliverableId: idDeliverable },
      orderBy: { submittedAt: "desc" },
    });
  }

  /**
   * Update a submission
   * @param idSubmission The submission ID
   * @param updateSubmissionDto DTO containing updated fields
   * @returns The updated submission
   */
  async update(idSubmission: string, updateSubmissionDto: UpdateSubmissionDto): Promise<Submission> {
    // Check if submission exists
    const submission = await this.prisma.submissions.findUnique({
      where: { id: idSubmission },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${idSubmission} not found`);
    }

    // Validate the data
    if (updateSubmissionDto.grade && (updateSubmissionDto.grade < 0 || updateSubmissionDto.grade > 100)) {
      throw new BadRequestException("Grade must be between 0 and 100");
    }

    // Update submission
    return this.prisma.submissions.update({
      where: { id: idSubmission },
      data: {
        ...updateSubmissionDto,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Upload student submission as a zip file to S3
   * @param file The file buffer to upload
   * @param submissionId The submission ID
   * @param groupId The group ID
   * @param projectId The project ID
   * @param promotionId The promotion ID
   * @param stepId The step ID
   * @returns Updated submission with S3 file key
   */
  async uploadStudentSubmission(
    file: Buffer,
    submissionId: string,
    groupId: string,
    projectId: string,
    promotionId: string,
    stepId: string,
  ): Promise<Submission> {
    // Check if submission exists
    const submission = await this.prisma.submissions.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    // Upload file to S3
    const s3Key = await this.s3Service.uploadZipSubmission(file, groupId, projectId, promotionId, stepId);

    // Update submission with S3 key
    return this.prisma.submissions.update({
      where: { id: submissionId },
      data: {
        fileUrl: s3Key,
        status: "FILE_UPLOADED",
        updatedAt: new Date(),
      },
    });
  }
}
