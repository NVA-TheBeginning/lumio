import fastifyHelmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "@/app.module.js";
import { HttpExceptionFilter } from "@/common/filters/http-exception.filter.js";
import { LoggingInterceptor } from "@/common/interceptors/logging.interceptor.js";
import { setupFederatedSwagger } from "@/docs/swagger-federation.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const configService = app.get(ConfigService);
  const logger = new Logger("Gateway");

  const port = configService.get<number>("port") || 3000;

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "15 minutes",
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: "Trop de requêtes. Réessayez plus tard.",
    }),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  await setupFederatedSwagger(app);

  await app.listen(port);

  const microservices = configService.get<Record<string, string>>("microservices") ?? {};
  logger.log("\x1b[36m📡 Routes des Microservices :\x1b[0m"); // cyan

  Object.entries(microservices).forEach(([name, url]) => {
    logger.log(`\x1b[33m- ${name}\x1b[0m: \x1b[32m${url}\x1b[0m`);
  });

  logger.log("\nApplication démarrée avec succès !");
  logger.log(`🚀 API Gateway listening on http://localhost:${port}`);
  logger.log(`📖 Swagger docs available on http://localhost:${port}/docs`);
}

bootstrap().catch((error) => {
  const logger = new Logger("Bootstrap");
  logger.error("❌ Application failed to start", error);
  process.exit(1);
});
