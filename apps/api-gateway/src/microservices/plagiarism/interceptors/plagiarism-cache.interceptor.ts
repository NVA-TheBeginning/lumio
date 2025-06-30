import { CacheInterceptor } from "@nestjs/cache-manager";
import { ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class PlagiarismCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { projectId, promotionId, step } = request.body as {
      projectId: string;
      promotionId: string;
      step: string;
    };

    if (projectId && promotionId && step) {
      return `plagiarism:checks:${projectId}:${promotionId}:${step}`;
    }

    return undefined;
  }
}
