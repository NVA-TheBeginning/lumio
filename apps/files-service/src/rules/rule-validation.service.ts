import { BadRequestException, Injectable } from "@nestjs/common";
import { RuleType } from "@prisma-files/client";
import * as yauzl from "yauzl";
import { PrismaService } from "@/prisma.service";
import { DirectoryStructureRuleDetails, FilePresenceRuleDetails, SizeLimitRuleDetails } from "@/rules/dto/rules.dto";

export interface RuleValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ZipFileEntry {
  fileName: string;
  isDirectory: boolean;
  size: number;
}

@Injectable()
export class RuleValidationService {
  constructor(private prisma: PrismaService) {}

  async validateSubmission(deliverableId: number, fileBuffer: Buffer): Promise<RuleValidationResult> {
    const rules = await this.prisma.deliverablesRules.findMany({
      where: { deliverableId },
    });

    if (rules.length === 0) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    const zipEntries = await this.extractZipEntries(fileBuffer);

    const validationPromises = rules.map(async (rule) => {
      const ruleDetails = JSON.parse(rule.ruleDetails);
      return this.validateRule(rule.ruleType, ruleDetails, fileBuffer, zipEntries);
    });

    const allRuleErrors = await Promise.all(validationPromises);
    allRuleErrors.forEach((ruleErrors) => errors.push(...ruleErrors));

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private async validateRule(
    ruleType: RuleType,
    ruleDetails: SizeLimitRuleDetails | FilePresenceRuleDetails | DirectoryStructureRuleDetails,
    fileBuffer: Buffer,
    zipEntries: ZipFileEntry[],
  ): Promise<string[]> {
    switch (ruleType) {
      case RuleType.SIZE_LIMIT:
        return this.validateSizeLimit(ruleDetails as SizeLimitRuleDetails, fileBuffer);

      case RuleType.FILE_PRESENCE:
        return this.validateFilePresence(ruleDetails as FilePresenceRuleDetails, zipEntries);

      case RuleType.DIRECTORY_STRUCTURE:
        return this.validateDirectoryStructure(ruleDetails as DirectoryStructureRuleDetails, zipEntries);

      default:
        return [`Unsupported rule type: ${ruleType}`];
    }
  }

  private validateSizeLimit(rule: SizeLimitRuleDetails, fileBuffer: Buffer): string[] {
    const errors: string[] = [];
    const fileSizeInBytes = fileBuffer.length;

    if (fileSizeInBytes > rule.maxSizeInBytes) {
      const maxSizeMB = (rule.maxSizeInBytes / (1024 * 1024)).toFixed(2);
      const actualSizeMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      errors.push(`File size exceeds limit. Maximum allowed: ${maxSizeMB}MB, actual size: ${actualSizeMB}MB`);
    }

    return errors;
  }

  private validateFilePresence(rule: FilePresenceRuleDetails, zipEntries: ZipFileEntry[]): string[] {
    const errors: string[] = [];
    const fileNames = zipEntries.filter((entry) => !entry.isDirectory).map((entry) => entry.fileName);

    for (const requiredFile of rule.requiredFiles) {
      const found = fileNames.some((fileName) => {
        if (requiredFile.includes("*")) {
          const pattern = requiredFile.replace(/\*/g, ".*");
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(fileName);
        }
        return fileName === requiredFile || fileName.endsWith(`/${requiredFile}`);
      });

      if (!found) {
        errors.push(`Required file missing: ${requiredFile}`);
      }
    }

    if (rule.allowedExtensions && rule.allowedExtensions.length > 0) {
      for (const fileName of fileNames) {
        const extension = this.getFileExtension(fileName);
        if (extension && !rule.allowedExtensions.includes(extension)) {
          errors.push(`File extension not allowed: ${fileName} (${extension})`);
        }
      }
    }

    if (rule.forbiddenExtensions && rule.forbiddenExtensions.length > 0) {
      for (const fileName of fileNames) {
        const extension = this.getFileExtension(fileName);
        if (extension && rule.forbiddenExtensions.includes(extension)) {
          errors.push(`Forbidden file extension: ${fileName} (${extension})`);
        }
      }
    }

    return errors;
  }

  private validateDirectoryStructure(rule: DirectoryStructureRuleDetails, zipEntries: ZipFileEntry[]): string[] {
    const errors: string[] = [];
    const directories = zipEntries.filter((entry) => entry.isDirectory).map((entry) => entry.fileName);
    const allPaths = zipEntries.map((entry) => entry.fileName);

    for (const requiredDir of rule.requiredDirectories) {
      const found =
        directories.some((dirName) => {
          return dirName === requiredDir || dirName.startsWith(`${requiredDir}/`);
        }) || allPaths.some((path) => path.startsWith(`${requiredDir}/`));

      if (!found) {
        errors.push(`Required directory missing: ${requiredDir}`);
      }
    }

    if (rule.forbiddenDirectories && rule.forbiddenDirectories.length > 0) {
      for (const forbiddenDir of rule.forbiddenDirectories) {
        const found =
          directories.some((dirName) => {
            return (
              dirName === forbiddenDir ||
              dirName.includes(`/${forbiddenDir}/`) ||
              dirName.startsWith(`${forbiddenDir}/`)
            );
          }) || allPaths.some((path) => path.includes(`/${forbiddenDir}/`) || path.startsWith(`${forbiddenDir}/`));

        if (found) {
          errors.push(`Forbidden directory found: ${forbiddenDir}`);
        }
      }
    }

    return errors;
  }

  private getFileExtension(fileName: string): string | null {
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
      return null;
    }
    return fileName.substring(lastDotIndex);
  }

  private async extractZipEntries(fileBuffer: Buffer): Promise<ZipFileEntry[]> {
    return new Promise((resolve, reject) => {
      const entries: ZipFileEntry[] = [];

      yauzl.fromBuffer(fileBuffer, { lazyEntries: true }, (err, zipfile) => {
        if (err || !zipfile) {
          reject(new BadRequestException("Invalid ZIP file"));
          return;
        }

        zipfile.on("entry", (entry) => {
          entries.push({
            fileName: entry.fileName,
            isDirectory: entry.fileName.endsWith("/"),
            size: entry.uncompressedSize,
          });
          zipfile.readEntry();
        });

        zipfile.on("end", () => {
          resolve(entries);
        });

        zipfile.on("error", (error) => {
          reject(new BadRequestException(`Error reading ZIP file: ${error.message}`));
        });

        zipfile.readEntry();
      });
    });
  }
}
