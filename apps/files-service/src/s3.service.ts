import * as path from "node:path";
import { Injectable, Optional } from "@nestjs/common";
import { randomUUIDv7, S3Client } from "bun";

interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint: string;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor(@Optional() config?: S3Config) {
    const s3Config = config || {
      region: process.env.REGION || "",
      accessKeyId: process.env.ACCESS_KEY_ID || "",
      secretAccessKey: process.env.SECRET_ACCESS_KEY || "",
      bucket: process.env.S3_BUCKET_NAME || "",
      endpoint: process.env.MINIO_ENDPOINT || "",
    };

    this.s3Client = new S3Client({
      region: s3Config.region,
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
      bucket: s3Config.bucket,
      endpoint: s3Config.endpoint,
    });
  }

  /**
   * Upload a file to S3 bucket
   * @param file The file buffer to upload
   * @param key The object key (path) in S3
   */
  async uploadFile(file: Buffer, key: string): Promise<void> {
    const s3file = this.s3Client.file(key);
    await s3file.write(file);
  }

  /**
   * Get a file from S3 bucket
   * @param key The object key in S3
   * @returns The file buffer
   */
  async getFile(key: string): Promise<Buffer> {
    const s3file = this.s3Client.file(key);
    const fileBuffer = Buffer.from(await s3file.arrayBuffer());
    return fileBuffer;
  }

  /**
   * Delete a file from S3 bucket
   * @param key The object key in S3
   */
  async deleteFile(key: string): Promise<void> {
    const s3file = this.s3Client.file(key);
    await s3file.delete();
  }

  /**
   * Generate a unique file key for S3
   * @param originalFilename The original filename
   * @returns A unique S3 key
   */
  generateFileKey(originalFilename: string): string {
    return `${randomUUIDv7()}-${path.basename(originalFilename)}`;
  }

  /**
   * Upload a zip student submission to S3
   * @param file The file buffer to upload
   * @param groupId The group ID
   * @param projectId The project ID
   * @param promotionId The promotion ID
   * @param stepId The step ID
   * @returns The S3 key of the uploaded file
   */
  async uploadZipSubmission(
    input: Buffer,
    groupId: string,
    projectId: number,
    promotionId: number,
    stepId: number,
  ): Promise<string> {
    const key = `project-${projectId}/promo-${promotionId}/step-${stepId}/${groupId}-${Date.now()}.zip`;
    await this.uploadFile(input, key);
    return key;
  }
}
