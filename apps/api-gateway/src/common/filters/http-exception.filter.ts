import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: HttpException, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<FastifyRequest>();
        const response = ctx.getResponse<FastifyReply>();

        const status = exception.getStatus
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const exceptionResponse = exception.getResponse();
        const message =
            typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as Record<string, unknown>).message || exception.message;

        this.logger.error(`[${request.method}] ${request.url} → ${status}: ${JSON.stringify(message)}`);

        response.status(status).send({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            error: message,
        });
    }
}