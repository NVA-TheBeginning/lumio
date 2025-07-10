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

interface S3Stat {
  etag: string;
  lastModified: Date;
  size: number;
  type: string;
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
    return Buffer.from(await s3file.arrayBuffer());
  }

  /**
   * Get file metadata from S3 bucket using stat()
   * @param key The object key in S3
   * @returns File metadata including size, lastModified, and contentType
   */
  async getFileMetadata(key: string): Promise<{ size: number; lastModified: Date; contentType: string }> {
    try {
      const s3file = this.s3Client.file(key);
      const stat: S3Stat = await s3file.stat();

      return {
        size: stat.size ?? 0,
        lastModified: stat.lastModified || new Date(),
        contentType: stat.type || "application/zip",
      };
    } catch (error) {
      console.error(`S3 metadata retrieval failed for key: ${key}`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists in S3 bucket
   * @param key The object key in S3
   * @returns True if file exists, false otherwise
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const s3file = this.s3Client.file(key);
      return await s3file.exists();
    } catch (error) {
      console.error(`S3 file existence check failed for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Get file size from S3 bucket
   * @param key The object key in S3
   * @returns File size in bytes
   */
  async getFileSize(key: string): Promise<number> {
    try {
      return await this.s3Client.size(key);
    } catch (error) {
      console.error(`S3 file size retrieval failed for key: ${key}`, error);
      throw error;
    }
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
   * Generate a presigned URL for S3 file
   * @param key The object key in S3
   * @param expiresIn Expiration time in seconds (default: 24 hours)
   * @param method HTTP method (default: "GET")
   * @returns Presigned URL
   */
  generatePresignedUrl(
    key: string,
    expiresIn: number = 24 * 60 * 60,
    method: "GET" | "PUT" | "DELETE" = "GET",
  ): string {
    const s3file = this.s3Client.file(key);
    return s3file.presign({
      expiresIn,
      method,
    });
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
    groupId: number,
    projectId: number,
    promotionId: number,
    stepId: number,
  ): Promise<string> {
    const key = `project-${projectId}/promo-${promotionId}/step-${stepId}/${groupId}-${Date.now()}.zip`;
    await this.uploadFile(input, key);
    return key;
  }

  /**
   * Retrieve all zip files within a specific project/promo/step folder in S3
   * @param projectId The project ID
   * @param promotionId The promotion ID
   * @param stepId The step ID
   * @returns An array of Buffers containing the zip file contents
   */
  async getAllSubmissions(projectId: number, promotionId: number, stepId: number): Promise<Buffer[]> {
    const folderPath = `project-${projectId}/promo-${promotionId}/step-${stepId}/`;

    const zipFiles: Buffer[] = [];
    try {
      const objects = await this.s3Client.list({ prefix: folderPath });

      if (!objects?.contents) {
        return [];
      }

      const zipObjectKeys = objects.contents.map((obj) => obj.key).filter((key) => key.endsWith(".zip"));

      await Promise.all(
        zipObjectKeys.map(async (key) => {
          const file = await this.getFile(key);
          zipFiles.push(file);
        }),
      );

      return zipFiles;
    } catch (error) {
      console.error("Failed to retrieve zip files:", error);
      return [];
    }
  }

  /**
   * Get metadata for all submissions in a folder (optimized version)
   * @param projectId The project ID
   * @param promotionId The promotion ID
   * @param stepId The step ID
   * @returns An array of file metadata
   */
  async getAllSubmissionsMetadata(
    projectId: number,
    promotionId: number,
    stepId: number,
  ): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
    const folderPath = `project-${projectId}/promo-${promotionId}/step-${stepId}/`;

    try {
      const objects = await this.s3Client.list({ prefix: folderPath });

      if (!objects?.contents) {
        return [];
      }

      return objects.contents
        .filter((obj) => obj.key.endsWith(".zip"))
        .map((obj) => ({
          key: obj.key,
          size: obj.size ?? 0,
          lastModified: obj.lastModified ? new Date(obj.lastModified) : new Date(),
        }));
    } catch (error) {
      console.error("Failed to retrieve zip files metadata:", error);
      return [];
    }
  }

  async uploadGitSubmission(
    username: string,
    repoName: string,
    groupId: number,
    projectId: number,
    promotionId: number,
    idDeliverable: number,
  ): Promise<string> {
    const key = `project-${projectId}/promo-${promotionId}/step-${idDeliverable}/${groupId}-${Date.now()}.zip`;
    // https://codeload.github.com/username/reponame/zip/main
    const url = `https://codeload.github.com/${username}/${repoName}/zip/main`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch the file from GitHub: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const file = Buffer.from(buffer);
    await this.uploadFile(file, key);
    return key;
  }
}
