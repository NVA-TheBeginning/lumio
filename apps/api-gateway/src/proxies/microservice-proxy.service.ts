import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AxiosRequestConfig, AxiosResponse } from "axios";
import { firstValueFrom } from "rxjs";

/**
 * Service pour rediriger les requêtes vers les microservices appropriés.
 */
@Injectable()
export class MicroserviceProxyService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Transmet une requête au microservice spécifié.
   * @param microservice Nom du microservice cible.
   * @param endpoint Endpoint du microservice.
   * @param method Méthode HTTP de la requête.
   * @param data Données à envoyer (le cas échéant).
   * @param params Paramètres de requête (le cas échéant).
   * @returns Réponse du microservice.
   */
  async forwardRequest(
    microservice: string,
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    data?: Record<string, unknown>,
    params?: Record<string, unknown>,
  ): Promise<AxiosResponse> {
    console.log(`Forwarding request to ${microservice} at ${endpoint} with method ${method}`);
    const microserviceUrl = this.configService.get<string>(`microservices.${microservice}`);

    if (!microserviceUrl) {
      throw new Error(`URL du microservice ${microservice} non configurée.`);
    }

    const url = `${microserviceUrl}${endpoint}`;
    const config: AxiosRequestConfig = {
      method,
      url,
      data,
      params,
    };

    // @ts-ignore
    return firstValueFrom(this.httpService.request(config));
  }
}
