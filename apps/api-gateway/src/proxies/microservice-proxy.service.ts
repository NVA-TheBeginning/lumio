import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface MicroserviceErrorResponse {
  statusCode?: number;
  message?: string;
  error?: string;
}

@Injectable()
export class MicroserviceProxyService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Transmet une requête HTTP au microservice cible en utilisant Axios.
   * @param microservice Nom clé du microservice dans la configuration.
   * @param endpoint Chemin relatif de l’endpoint (ex. "/auth/login").
   * @param method Méthode HTTP à utiliser.
   * @param data Payload JSON (pour POST/PUT/PATCH).
   * @param params Query params (pour GET/DELETE/PATCH).
   * @param headers
   * @returns Le body de la réponse typé TResponse.
   */
  async forwardRequest<TResponse>(
    microservice: string,
    endpoint: string,
    method: HttpMethod,
    data?: object,
    params?: object,
  ): Promise<TResponse> {
    const baseUrl = this.configService.get<string>(`microservices.${microservice}`);
    if (!baseUrl) {
      throw new Error(`URL du microservice "${microservice}" non configurée.`);
    }

    const url = `${baseUrl}${endpoint}`;
    const config: AxiosRequestConfig = { url, method, data, params };

    try {
      const response = await axios.request<TResponse>(config);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<MicroserviceErrorResponse>;
      const status = error.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error.response?.data?.message || error.response?.data?.error || error.message || "Erreur microservice inconnue";
      throw new HttpException(`[${microservice}] ${message}`, status);
    }
  }
}
