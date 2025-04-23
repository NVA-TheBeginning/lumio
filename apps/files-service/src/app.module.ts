import { Module } from "@nestjs/common";
import { DeliverablesModule } from "./deliverables/deliverables.module.js";
import { DocumentsModule } from "./documents/documents.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [HealthModule, DocumentsModule, DeliverablesModule],
})
export class AppModule {}
