import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import axios from "axios";
import { microservicesDocs } from "@/config/microservices.config.js";
import { setupFederatedSwagger } from "./swagger-federation.js";

mock.module("axios", () => ({
  default: {
    get: mock(() => Promise.resolve({ data: {} })),
  },
  get: mock(() => Promise.resolve({ data: {} })),
}));

mock.module("@nestjs/swagger", () => ({
  SwaggerModule: {
    createDocument: mock(() => ({})),
    setup: mock(() => {}),
  },
  DocumentBuilder: mock(() => {
    return {
      setTitle: mock(() => ({
        setDescription: mock(() => ({
          setVersion: mock(() => ({
            addBearerAuth: mock(() => ({
              build: mock(() => ({})),
            })),
          })),
        })),
      })),
    };
  }),
}));

describe("setupFederatedSwagger", () => {
  let mockApp: INestApplication;
  let consoleInfoSpy: ReturnType<typeof spyOn>;
  let consoleWarnSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    mockApp = {
      get: mock(() => ({})),
    } as unknown as INestApplication;

    consoleInfoSpy = spyOn(console, "info");
    consoleWarnSpy = spyOn(console, "warn");

    consoleInfoSpy.mockClear();
    consoleWarnSpy.mockClear();
    (SwaggerModule.createDocument as ReturnType<typeof mock>).mockClear();
    (SwaggerModule.setup as ReturnType<typeof mock>).mockClear();
    (axios.get as ReturnType<typeof mock>).mockClear();
  });

  test("should fetch and merge swagger docs from available microservices", async () => {
    const mockServiceResponse = {
      data: {
        paths: {
          "/test": { get: {} },
        },
        components: {
          schemas: {
            TestModel: { type: "object" },
          },
        },
      },
    };

    (axios.get as ReturnType<typeof mock>).mockImplementation(() => Promise.resolve(mockServiceResponse));

    await setupFederatedSwagger(mockApp);

    expect(DocumentBuilder).toHaveBeenCalled();
    expect(SwaggerModule.createDocument).toHaveBeenCalledWith(mockApp, expect.anything());
    expect(SwaggerModule.setup).toHaveBeenCalledWith("ui", mockApp, expect.anything());
    expect(axios.get).toHaveBeenCalledTimes(microservicesDocs.length);
    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining("\x1b[34m"));
  });

  test("should handle failure gracefully when microservices are unavailable", async () => {
    (axios.get as ReturnType<typeof mock>).mockImplementation(() => Promise.reject(new Error("Service unavailable")));

    await setupFederatedSwagger(mockApp);
    expect(consoleInfoSpy).toHaveBeenCalledWith("Aucun swagger disponible.");
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Service unavailable"));
  });
});
