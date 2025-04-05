import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { AxiosHeaders, AxiosResponse } from "axios";
import { Observable, of } from "rxjs";
import { MicroserviceProxyService } from "./microservice-proxy.service.js";

function createTestResponse<T>(data: T): Observable<AxiosResponse<T>> {
  const response: AxiosResponse<T> = {
    data,
    status: 200,
    statusText: "OK",
    headers: {},
    config: {
      url: "http://test.com",
      headers: new AxiosHeaders(),
    } as AxiosResponse<T>["config"],
  };
  return of(response);
}

describe("MicroserviceProxyService", () => {
  let service: MicroserviceProxyService;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MicroserviceProxyService,
        {
          provide: HttpService,
          useValue: {
            get: <T>() => createTestResponse<T>({} as T),
            post: <T>() => createTestResponse<T>({} as T),
            put: <T>() => createTestResponse<T>({} as T),
            delete: <T>() => createTestResponse<T>({} as T),
            patch: <T>() => createTestResponse<T>({} as T),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: () => "http://test-service.com",
          },
        },
      ],
    }).compile();

    service = module.get<MicroserviceProxyService>(MicroserviceProxyService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  test("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("forwardRequest", () => {
    interface UserResponse {
      user: {
        id: number;
        name?: string;
        active?: boolean;
      };
    }

    interface LoginResponse {
      token: string;
    }

    function createMethodSpy<T>(returnData: T) {
      const spy = mock(() => createTestResponse<T>(returnData));
      return spy;
    }

    test("should throw an error if microservice URL is not configured", async () => {
      spyOn(configService, "get").mockReturnValue(undefined);
      const microservice = "auth";

      await expect(
        service.forwardRequest<LoginResponse>(microservice, "/auth/login", "POST", { email: "test@example.com" }),
      ).rejects.toThrow(`URL du microservice ${microservice} non configurée.`);
    });

    test("should forward GET request correctly", async () => {
      const mockUrl = "http://auth-service:3002";
      const mockResponseData: UserResponse = { user: { id: 1 } };

      spyOn(configService, "get").mockReturnValue(mockUrl);

      const getMock = createMethodSpy<UserResponse>(mockResponseData);
      // @ts-ignore
      spyOn(httpService, "get").mockImplementation(getMock);

      const result = await service.forwardRequest<UserResponse>("auth", "/users", "GET", undefined, { id: 1 });

      expect(configService.get).toHaveBeenCalledWith("microservices.auth");
      expect(httpService.get).toHaveBeenCalledWith(`${mockUrl}/users`, { params: { id: 1 } });
      expect(result).toEqual(mockResponseData);
    });

    test("should forward POST request correctly", async () => {
      const mockUrl = "http://auth-service:3002";
      const mockRequestData = { email: "test@example.com", password: "password" };
      const mockResponseData: LoginResponse = { token: "jwt-token" };

      spyOn(configService, "get").mockReturnValue(mockUrl);

      const postMock = createMethodSpy<LoginResponse>(mockResponseData);
      // @ts-ignore
      spyOn(httpService, "post").mockImplementation(postMock);

      const result = await service.forwardRequest<LoginResponse>("auth", "/auth/login", "POST", mockRequestData);

      expect(configService.get).toHaveBeenCalledWith("microservices.auth");
      expect(httpService.post).toHaveBeenCalledWith(`${mockUrl}/auth/login`, mockRequestData, { params: undefined });
      expect(result).toEqual(mockResponseData);
    });

    test("should forward PUT request correctly", async () => {
      const mockUrl = "http://user-service:3003";
      const mockRequestData = { name: "Updated Name" };
      const mockResponseData: UserResponse = { user: { id: 1, name: "Updated Name" } };

      spyOn(configService, "get").mockReturnValue(mockUrl);

      const putMock = createMethodSpy<UserResponse>(mockResponseData);
      // @ts-ignore
      spyOn(httpService, "put").mockImplementation(putMock);

      const result = await service.forwardRequest<UserResponse>("auth", "/users/1", "PUT", mockRequestData);

      expect(configService.get).toHaveBeenCalledWith("microservices.auth");
      expect(httpService.put).toHaveBeenCalledWith(`${mockUrl}/users/1`, mockRequestData, { params: undefined });
      expect(result).toEqual(mockResponseData);
    });

    test("should forward DELETE request correctly", async () => {
      const mockUrl = "http://user-service:3003";
      const mockResponseData = { success: true };

      spyOn(configService, "get").mockReturnValue(mockUrl);

      const deleteMock = createMethodSpy<{ success: boolean }>(mockResponseData);
      // @ts-ignore
      spyOn(httpService, "delete").mockImplementation(deleteMock);

      const result = await service.forwardRequest<{ success: boolean }>("auth", "/users/1", "DELETE");

      expect(configService.get).toHaveBeenCalledWith("microservices.auth");
      expect(httpService.delete).toHaveBeenCalledWith(`${mockUrl}/users/1`, { params: undefined });
      expect(result).toEqual(mockResponseData);
    });

    test("should forward PATCH request correctly", async () => {
      const mockUrl = "http://user-service:3003";
      const mockRequestData = { active: true };
      const mockResponseData: UserResponse = { user: { id: 1, active: true } };

      spyOn(configService, "get").mockReturnValue(mockUrl);

      const patchMock = createMethodSpy<UserResponse>(mockResponseData);
      // @ts-ignore
      spyOn(httpService, "patch").mockImplementation(patchMock);

      const result = await service.forwardRequest<UserResponse>("auth", "/users/1/status", "PATCH", mockRequestData);

      expect(configService.get).toHaveBeenCalledWith("microservices.auth");
      expect(httpService.patch).toHaveBeenCalledWith(`${mockUrl}/users/1/status`, mockRequestData, {
        params: undefined,
      });
      expect(result).toEqual(mockResponseData);
    });
  });
});
