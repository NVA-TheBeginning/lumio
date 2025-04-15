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

// Used to delay the application startup for a few seconds to allow other services to be ready
// before the gateway starts accepting requests.
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function bootstrap() {
  const logger = new Logger("Gateway");

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const configService = app.get(ConfigService);

  const port = configService.get<number>("port") ?? 3000;

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  await app.register(rateLimit, {
    max: 1000,
    timeWindow: "1m",
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

  const startDelay = 3000;
  logger.log("⏳ Delaying federated Swagger setup for 3 seconds...");
  await sleep(startDelay);

  await setupFederatedSwagger(app);

  app.enableCors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  await app.listen(port, "0.0.0.0");
  const url = await app.getUrl();

  const microservices = configService.get<Record<string, string>>("microservices") ?? {};
  logger.log("\x1b[36m📡 Routes des Microservices :\x1b[0m");

  Object.entries(microservices).forEach(([name, url]) => {
    logger.log(`\x1b[33m- ${name}\x1b[0m: \x1b[32m${url}\x1b[0m`);
  });

  logger.log("Application démarrée avec succès !");
  logger.log(`🚀 API Gateway listening on ${url}`);
  logger.log(`API Docs available at: ${url}/docs`);
  logger.log(`Swagger UI available at: ${url}/ui`);
}

bootstrap().catch((error) => {
  const logger = new Logger("Bootstrap");
  logger.error("❌ Application failed to start", error);
  process.exit(1);
});
