import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

function makeResponse<T>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: "OK",
    headers: {},
    config: {} as unknown as InternalAxiosRequestConfig<T>,
  };
}

describe("MicroserviceProxyService", () => {
  let service: MicroserviceProxyService;
  let configService: ConfigService;
  let originalRequest: typeof axios.request;

  beforeEach(async () => {
    originalRequest = axios.request;

    const module = await Test.createTestingModule({
      providers: [
        MicroserviceProxyService,
        {
          provide: ConfigService,
          useValue: new ConfigService({ microservices: { auth: "http://test-service.com" } }),
        },
      ],
    }).compile();

    service = module.get(MicroserviceProxyService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    axios.request = originalRequest;
  });

  test("service should be defined", () => {
    expect(service).toBeDefined();
  });

  test("throws if microservice URL not configured", () => {
    spyOn(configService, "get").mockReturnValue(undefined);

    const promise = service.forwardRequest("auth", "/foo", "GET");
    expect(promise).rejects.toThrow('URL du microservice "auth" non configurée.');
  });

  describe("forwardRequest / success cases", () => {
    const baseUrl = "http://auth.test";

    beforeEach(() => {
      spyOn(configService, "get").mockReturnValue(baseUrl);
    });

    test("GET", async () => {
      const query = { foo: "bar" };
      const responseData = { result: 123 };
      let calledCfg: AxiosRequestConfig | undefined;

      axios.request = ((cfg: AxiosRequestConfig) => {
        calledCfg = cfg;
        return Promise.resolve(makeResponse(responseData));
      }) as unknown as typeof axios.request;

      const result = await service.forwardRequest<{ result: number }>("auth", "/items", "GET", undefined, query);

      expect(calledCfg).toEqual({
        url: `${baseUrl}/items`,
        method: "GET",
        data: undefined,
        params: query,
      });
      expect(result).toEqual(responseData);
    });

    test("POST", async () => {
      const body = { a: 1 };
      const responseData = { id: 42 };
      let calledCfg: AxiosRequestConfig | undefined;

      axios.request = ((cfg: AxiosRequestConfig) => {
        calledCfg = cfg;
        return Promise.resolve(makeResponse(responseData, 201));
      }) as unknown as typeof axios.request;

      const result = await service.forwardRequest<{ id: number }>("auth", "/items", "POST", body);

      expect(calledCfg).toEqual({
        url: `${baseUrl}/items`,
        method: "POST",
        data: body,
        params: undefined,
      });
      expect(result).toEqual(responseData);
    });

    test("PUT", async () => {
      const body = { name: "X" };
      const responseData = { name: "X" };
      let calledCfg: AxiosRequestConfig | undefined;

      axios.request = ((cfg: AxiosRequestConfig) => {
        calledCfg = cfg;
        return Promise.resolve(makeResponse(responseData));
      }) as unknown as typeof axios.request;

      const result = await service.forwardRequest<{ name: string }>("auth", "/items/1", "PUT", body);

      expect(calledCfg).toEqual({
        url: `${baseUrl}/items/1`,
        method: "PUT",
        data: body,
        params: undefined,
      });
      expect(result).toEqual(responseData);
    });

    test("DELETE", async () => {
      const responseData = { success: true };
      let calledCfg: AxiosRequestConfig | undefined;

      axios.request = ((cfg: AxiosRequestConfig) => {
        calledCfg = cfg;
        return Promise.resolve(makeResponse(responseData));
      }) as unknown as typeof axios.request;

      const result = await service.forwardRequest<{ success: boolean }>("auth", "/items/1", "DELETE");

      expect(calledCfg).toEqual({
        url: `${baseUrl}/items/1`,
        method: "DELETE",
        data: undefined,
        params: undefined,
      });
      expect(result).toEqual(responseData);
    });

    test("PATCH", async () => {
      const body = { active: true };
      const responseData = { active: true };
      let calledCfg: AxiosRequestConfig | undefined;

      axios.request = ((cfg: AxiosRequestConfig) => {
        calledCfg = cfg;
        return Promise.resolve(makeResponse(responseData));
      }) as unknown as typeof axios.request;

      const result = await service.forwardRequest<{ active: boolean }>("auth", "/items/1", "PATCH", body);

      expect(calledCfg).toEqual({
        url: `${baseUrl}/items/1`,
        method: "PATCH",
        data: body,
        params: undefined,
      });
      expect(result).toEqual(responseData);
    });
  });

  describe("forwardRequest / error handling", () => {
    beforeEach(() => {
      spyOn(configService, "get").mockReturnValue("http://test-service.com");
    });

    test("transforms axios error into HttpException", () => {
      const axiosErr = {
        isAxiosError: true,
        response: {
          status: 418,
          data: { message: "I am a teapot" },
        },
        message: "fail",
      } as AxiosError;

      axios.request = (() => Promise.reject(axiosErr)) as unknown as typeof axios.request;

      const promise = service.forwardRequest("auth", "/fail", "GET");
      expect(promise).rejects.toMatchObject({
        status: 418,
        message: "[auth] I am a teapot",
      });
    });
  });
});
