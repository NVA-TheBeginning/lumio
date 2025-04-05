import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "@/app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: true }));

  const config = new DocumentBuilder().setTitle("API").setVersion("1.0").build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  app.enableCors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  Logger.log("CORS enabled with origin: * and methods: GET, POST, PUT, DELETE, OPTIONS");

  await app.listen(process.env.PORT ?? 3002, "0.0.0.0");
  const url = await app.getUrl();
  Logger.log(`Server is running on: ${url}`);
  Logger.log(`API Docs available at: ${url}/api`);
}
bootstrap();
