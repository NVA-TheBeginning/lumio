import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

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
  async forwardRequest<TResponse>(
    microservice: string,
    endpoint: string,
    method: HttpMethod,
    data?: Record<string, unknown>,
    params?: Record<string, unknown>,
  ): Promise<TResponse> {
    console.log(`Forwarding request to ${microservice} at ${endpoint} with method ${method}`);
    const microserviceUrl = this.configService.get<string>(`microservices.${microservice}`);

    if (!microserviceUrl) {
      throw new Error(`URL du microservice ${microservice} non configurée.`);
    }

    const url = `${microserviceUrl}${endpoint}`;

    let response: { data: TResponse };

    switch (method) {
      case "GET":
        response = await firstValueFrom(this.httpService.get<TResponse>(url, { params }));
        break;
      case "POST":
        response = await firstValueFrom(this.httpService.post<TResponse>(url, data, { params }));
        break;
      case "PUT":
        response = await firstValueFrom(this.httpService.put<TResponse>(url, data, { params }));
        break;
      case "DELETE":
        response = await firstValueFrom(this.httpService.delete<TResponse>(url, { params }));
        break;
      case "PATCH":
        response = await firstValueFrom(this.httpService.patch<TResponse>(url, data, { params }));
        break;
    }

    return response.data;
  }
}
