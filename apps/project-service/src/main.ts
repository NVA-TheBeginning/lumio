import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "@/app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: true }));

  const config = new DocumentBuilder().setTitle("Project Service").setVersion("1.0").build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("ui", app, document);
  SwaggerModule.setup("swagger", app, document, {
    jsonDocumentUrl: "docs",
  });

  app.enableCors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  Logger.log("CORS enabled with origin: * and methods: GET, POST, PUT, DELETE, OPTIONS");

  await app.listen(3003, "0.0.0.0");

  const url = await app.getUrl();
  Logger.log(`Project service is running on: ${url}`);
  Logger.log(`API Docs available at: ${url}/docs`);
  Logger.log(`Swagger UI available at: ${url}/ui`);
}
void bootstrap();
