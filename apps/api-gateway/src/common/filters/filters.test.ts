import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { HttpExceptionFilter } from "./http-exception.filter.js";

describe("HttpExceptionFilter", () => {
  let filter: HttpExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: {
    method: string;
    url: string;
  };
  let mockResponse: {
    status: ReturnType<typeof mock>;
    send: ReturnType<typeof mock>;
  };
  let mockHttpContext: {
    getRequest: ReturnType<typeof mock>;
    getResponse: ReturnType<typeof mock>;
  };

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockRequest = {
      method: "GET",
      url: "/test",
    };

    mockResponse = {
      status: mock(() => mockResponse),
      send: mock(() => {}),
    };

    mockHttpContext = {
      getRequest: mock(() => mockRequest),
      getResponse: mock(() => mockResponse),
    };

    mockArgumentsHost = {
      switchToHttp: mock(() => mockHttpContext),
    } as unknown as ArgumentsHost;
  });

  describe("catch", () => {
    test("should handle exception with message string", () => {
      const errorMessage = "Something went wrong";
      const mockException = new HttpException(errorMessage, HttpStatus.BAD_REQUEST);

      filter.catch(mockException, mockArgumentsHost);

      expect(mockArgumentsHost.switchToHttp).toHaveBeenCalled();
      expect(mockHttpContext.getRequest).toHaveBeenCalled();
      expect(mockHttpContext.getResponse).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: "/test",
        error: errorMessage,
      });
    });

    test("should handle exception with response object", () => {
      const errorObj = {
        message: "Validation error",
        errors: ["Field is required"],
      };
      const mockException = new HttpException(errorObj, HttpStatus.BAD_REQUEST);

      filter.catch(mockException, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.send).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        timestamp: expect.any(String),
        path: "/test",
        error: errorObj.message,
      });
    });

    test("should use INTERNAL_SERVER_ERROR status if not provided", () => {
      const errorMessage = "Unknown error";
      const mockException = {
        getResponse: () => errorMessage,
        message: errorMessage,
      } as HttpException;

      filter.catch(mockException, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.send).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        timestamp: expect.any(String),
        path: "/test",
        error: errorMessage,
      });
    });
  });
});
