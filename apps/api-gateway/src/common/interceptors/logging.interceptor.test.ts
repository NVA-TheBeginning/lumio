import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { CallHandler, ExecutionContext, Logger } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { of } from "rxjs";
import { LoggingInterceptor } from "@/common/interceptors/logging.interceptor.js";

describe("LoggingInterceptor", () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let loggerSpy: ReturnType<typeof mock>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: "GET",
          url: "/test",
          body: { test: "body" },
          params: { id: "1" },
          query: { filter: "test" },
        }),
      }),
    } as ExecutionContext;

    mockCallHandler = {
      handle: () => of({}),
    };

    loggerSpy = mock((message: string) => {});
    Logger.prototype.log = loggerSpy;
  });

  afterEach(() => {
    loggerSpy.mockClear();
  });

  it("should log incoming request and response", (done) => {
    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      complete: () => {
        expect(loggerSpy.mock.calls.length).toBe(2);
        expect(loggerSpy.mock.calls[0][0]).toContain("Incoming request: GET /test");
        expect(loggerSpy.mock.calls[1][0]).toContain("Response sent for GET /test");
        done();
      },
    });
  });

  it("should include request details in log", (done) => {
    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      complete: () => {
        const logMessage = loggerSpy.mock.calls[0][0];
        expect(logMessage).toContain('"id":"1"');
        expect(logMessage).toContain('"filter":"test"');
        expect(logMessage).toContain('"test":"body"');
        done();
      },
    });
  });
});
