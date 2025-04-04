// src/gateway/main.ts
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "@/app.module.js";
import { LoggingInterceptor } from "@/common/interceptors/logging.interceptor.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  // Pipe global pour valider et transformer les données d'entrée
  app.useGlobalPipes(new ValidationPipe());

  // Interceptor global pour logger les requêtes et mesurer leur temps d'exécution
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Configuration de Swagger pour documenter l'API Gateway
  const config = new DocumentBuilder().setTitle("API Gateway").setVersion("1.0").build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
  const url = await app.getUrl();
  Logger.log(`Server is running on: ${url}`);
  Logger.log(`API Docs available at: ${url}/api`);
}

bootstrap();
