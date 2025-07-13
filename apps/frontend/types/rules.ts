export enum RuleType {
  SIZE_LIMIT = "SIZE_LIMIT",
  FILE_PRESENCE = "FILE_PRESENCE",
  DIRECTORY_STRUCTURE = "DIRECTORY_STRUCTURE",
}

export interface SizeLimitRuleDetails {
  maxSizeInBytes: number;
}

export interface FilePresenceRuleDetails {
  requiredFiles: string[];
  allowedExtensions?: string[];
  forbiddenExtensions?: string[];
}

export interface DirectoryStructureRuleDetails {
  requiredDirectories: string[];
  forbiddenDirectories?: string[];
}

export interface DeliverableRule {
  id: number;
  deliverableId: number;
  ruleType: RuleType;
  ruleDetails: SizeLimitRuleDetails | FilePresenceRuleDetails | DirectoryStructureRuleDetails;
}
