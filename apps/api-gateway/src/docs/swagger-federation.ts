import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import axios from "axios";
import { microservicesDocs } from "@/config/microservices.config.js";

export async function setupFederatedSwagger(app: INestApplication): Promise<void> {
  // 🧱 1. Générer Swagger local (Gateway)
  const localDocConfig = new DocumentBuilder()
    .setTitle("API Gateway")
    .setDescription("Documentation centralisée des microservices")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const localDocument = SwaggerModule.createDocument(app, localDocConfig);

  // 🌐 2. Récupérer les Swagger distants
  const remoteDocs = await Promise.all(
    microservicesDocs.map(async ({ name, url }) => {
      try {
        const { data } = await axios.get(`${url}/api-json`);
        return { name, doc: data };
      } catch (error) {
        const err = error as Error;
        console.warn(`⚠️\x1b[31m  Swagger indisponible pour ${name} (${url}): ${err.message}\x1b[0m`);
        return null;
      }
    }),
  );

  // 🧩 3. Fusionner local + distants
  const merged = {
    ...localDocument,
    paths: (() => {
      const paths = { ...localDocument.paths };
      for (const doc of remoteDocs) {
        if (doc) {
          Object.assign(paths, doc.doc.paths);
        }
      }
      return paths;
    })(),
    components: {
      ...(localDocument.components || {}),
      schemas: (() => {
        const schemas = { ...(localDocument.components?.schemas || {}) };
        for (const doc of remoteDocs) {
          if (doc?.doc.components?.schemas) {
            Object.assign(schemas, doc.doc.components.schemas);
          }
        }
        return schemas;
      })(),
    },
  };

  // 6. Log propre des microservices intégrés
  const loaded = remoteDocs.filter((doc): doc is { name: string; doc: unknown } => !!doc);
  if (loaded.length === 0) {
    console.warn("⚠️ \x1b[31m Aucun microservice n'a pu être chargé.\x1b[0m");
  } else {
    console.info(`✅ Swagger fusionné depuis : ${loaded.map((d) => d.name).join(", ")}`);
  }

  // 🔧 4. Exposer sur /docs
  SwaggerModule.setup("docs", app, merged);
}
