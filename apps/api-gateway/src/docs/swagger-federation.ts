import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import axios from "axios";
import { microservicesDocs } from "@/config/microservices.config.js";

export async function setupFederatedSwagger(app: INestApplication): Promise<void> {
  const availableLinks: string[] = [];
  const unavailableLinks: string[] = [];

  for (const { name, url } of microservicesDocs) {
    try {
      await axios.get(`${url}/docs`);
      availableLinks.push(`- **${name}** : [Voir Swagger](${url}/ui/)`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      unavailableLinks.push(`- **${name}** (${url}): ${err.message}`);
    }
  }

  console.info("✅ Swagger disponibles:");
  if (availableLinks.length > 0) {
    availableLinks.forEach((link) => {
      console.info(`\x1b[34m${link}\x1b[0m`);
    });
  } else {
    console.info("Aucun swagger disponible.");
  }

  console.warn("⚠️ Swagger indisponibles:");
  if (unavailableLinks.length > 0) {
    unavailableLinks.forEach((link) => {
      console.warn(`\x1b[31m${link}\x1b[0m`);
    });
  } else {
    console.info("Tous les swagger sont disponibles.");
  }

  const description = [
    "Documentation de l'API Gateway.",
    "",
    "### Documentation des microservices disponibles :",
    ...availableLinks,
    "",
    "### Documentation des microservices indisponibles :",
    ...unavailableLinks,
  ].join("\n");

  const localDocConfig = new DocumentBuilder()
    .setTitle("API Gateway")
    .setDescription(description)
    .setVersion("1.1")
    .addBearerAuth()
    .build();

  const localDocument = SwaggerModule.createDocument(app, localDocConfig);
  SwaggerModule.setup("ui", app, localDocument);
  SwaggerModule.setup("swagger", app, localDocument, {
    jsonDocumentUrl: "docs",
  });
}
