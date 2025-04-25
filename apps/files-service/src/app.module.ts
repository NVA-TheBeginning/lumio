import { Module } from "@nestjs/common";
import { DeliverablesModule } from "./deliverables/deliverables.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { HealthModule } from "./health/health.module.js";
import { RulesModule } from "./rules/rules.module.js";
import { SubmissionsModule } from "./submissions/submissions.module.js";

@Module({
  imports: [HealthModule, DocumentsModule, DeliverablesModule, RulesModule, SubmissionsModule],
})
export class AppModule {}
