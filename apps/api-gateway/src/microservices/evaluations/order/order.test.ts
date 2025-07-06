import { afterAll, beforeAll, describe, expect, jest, test } from "bun:test";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@/app.module.js";
import { GenerateOrdersDto } from "@/microservices/evaluations/order/dto/generate-orders.dto.js";
import { GenerateOrdersInputDto } from "@/microservices/evaluations/order/dto/generate-orders-input.dto.js";
import { MicroserviceProxyService } from "@/proxies/microservice-proxy.service.js";

describe("Gateway – Orders", () => {
  let app: NestFastifyApplication;

  const proxyMock = {
    forwardRequest: jest.fn<MicroserviceProxyService["forwardRequest"]>(),
  };

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MicroserviceProxyService)
      .useValue(proxyMock)
      .compile();

    app = modRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  test("POST /presentations/:id/orders/generate – happy path", async () => {
    proxyMock.forwardRequest.mockReset();
    proxyMock.forwardRequest
      .mockResolvedValueOnce({ projectId: 10, promotionId: 20 }) // pres
      .mockResolvedValueOnce([{ id: 111 }, { id: 222 }]) // groups
      .mockResolvedValueOnce({ created: 2 }); // generate

    const dto: GenerateOrdersInputDto = { algorithm: "RANDOM", shuffleSeed: 42 };

    const res = await app.inject({
      method: "POST",
      url: "/presentations/1/orders/generate",
      payload: dto,
    });

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body)).toEqual({ created: 2 });

    expect(proxyMock.forwardRequest).toHaveBeenCalledTimes(3);

    const thirdCall = proxyMock.forwardRequest.mock.calls[2];
    const sentPayload = thirdCall[3] as GenerateOrdersDto;
    expect(sentPayload.groupIds).toEqual([111, 222]);
    expect(sentPayload.algorithm).toBe("RANDOM");
    expect(sentPayload.shuffleSeed).toBe(42);
  });

  test("POST generate – aucun groupe", async () => {
    proxyMock.forwardRequest.mockReset();
    proxyMock.forwardRequest
      .mockResolvedValueOnce({ projectId: 10, promotionId: 20 }) // pres
      .mockResolvedValueOnce([]); // groups

    const res = await app.inject({
      method: "POST",
      url: "/presentations/1/orders/generate",
      payload: {},
    });

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body)).toEqual({
      message: "Aucun groupe, rien à générer",
      created: 0,
    });
    expect(proxyMock.forwardRequest).toHaveBeenCalledTimes(2);
  });

  test("PATCH reorder – simplement forwardé", async () => {
    proxyMock.forwardRequest.mockReset().mockResolvedValueOnce({ reordered: true });

    const res = await app.inject({
      method: "PATCH",
      url: "/presentations/1/orders/reorder",
      payload: { from: 2, to: 1 },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ reordered: true });

    const [svc, path] = proxyMock.forwardRequest.mock.calls[0];
    expect(svc).toBe("evaluation");
    expect(path).toBe("/presentations/1/orders/reorder");
  });
});
