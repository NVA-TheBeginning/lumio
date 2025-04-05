import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params, query } = request;
    const now = Date.now();

    this.logger.log(
        `Incoming request: ${method} ${url} - Params: ${JSON.stringify(
            params,
        )}, Query: ${JSON.stringify(query)}, Body: ${JSON.stringify(body)}`,
    );

    return next.handle().pipe(
        tap(() =>
            this.logger.log(
                `Response sent for ${method} ${url} in ${Date.now() - now}ms`,
            ),
        ),
    );
  }
}
