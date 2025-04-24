import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "@/health/health.controller.js";
import { AuthModule } from "@/microservices/auth/auth.module.js";
import { ProjectsModule } from "@/microservices/projects-groups/projects.module.js";
import configuration from "./config/configuration.js";
import { UsersModule } from "./microservices/auth/users/users.module.js";
import { FilesModule } from "./microservices/files/files.module.js";
import { MicroserviceProxyModule } from "./proxies/microservice-proxy.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MicroserviceProxyModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    FilesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
