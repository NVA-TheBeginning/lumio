import { Module } from "@nestjs/common";
import { DocumentsModule } from "./documents/documents.module.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [HealthModule, DocumentsModule],
})
export class AppModule {}
