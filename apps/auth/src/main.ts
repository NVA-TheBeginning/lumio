import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "@/app.module.js";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  const config = new DocumentBuilder().setTitle("API").setVersion("1.0").build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
  const url = await app.getUrl();
  Logger.log(`Server is running on: ${url}`);
  Logger.log(`API Docs available at: ${url}/api`);
}
bootstrap();
