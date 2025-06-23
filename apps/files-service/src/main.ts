import fastifyMultipart from "@fastify/multipart";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "@/app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true, bodyLimit: 10485760 }),
  );

  const config = new DocumentBuilder().setTitle("Files Service").setVersion("1.0").build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("ui", app, documentFactory);
  SwaggerModule.setup("swagger", app, documentFactory, {
    jsonDocumentUrl: "docs",
  });

  await app.register(fastifyMultipart);
  app.enableCors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: "Content-Type, Accept",
  });

  Logger.log("CORS enabled with origin: * and methods: GET, POST, PUT, DELETE, OPTIONS");

  await app.listen(3004, "0.0.0.0");

  const url = await app.getUrl();
  Logger.log(`Files service is running on: ${url}`);
  Logger.log(`API Docs available at: ${url}/docs`);
  Logger.log(`Swagger UI available at: ${url}/ui`);
}
void bootstrap();
