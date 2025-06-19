import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "@/app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: true }));

  const config = new DocumentBuilder().setTitle("Evaluation Service").setVersion("1.0").build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("ui", app, documentFactory);
  SwaggerModule.setup("swagger", app, documentFactory, {
    jsonDocumentUrl: "docs",
  });

  app.enableCors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  Logger.log("CORS enabled with origin: * and methods: GET, POST, PUT, DELETE, OPTIONS");

  await app.listen(3006, "0.0.0.0");

  const url = await app.getUrl();
  Logger.log(`Server is running on: ${url}`);
  Logger.log(`API Docs available at: ${url}/docs`);
  Logger.log(`Swagger UI available at: ${url}/ui`);
}
void bootstrap();
