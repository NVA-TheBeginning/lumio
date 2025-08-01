import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";

const REGEX = /^\[\w+\]\s/;

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>();

    const status = typeof exception.getStatus === "function" ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception.getResponse();

    const rawMessage =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : ((exceptionResponse as Record<string, unknown>).message ?? exception.message);

    this.logger.error(`[${request.method}] ${request.url} → ${status}: ${JSON.stringify(rawMessage)}`);

    const message = typeof rawMessage === "string" ? rawMessage.replace(REGEX, "") : rawMessage;

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
    });
  }
}
