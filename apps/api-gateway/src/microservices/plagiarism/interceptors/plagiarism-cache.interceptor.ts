import { CacheInterceptor } from "@nestjs/cache-manager";
import { ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class PlagiarismCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { projectId, promotionId } = request.body as {
      projectId: string;
      promotionId: string;
    };

    if (projectId && promotionId) {
      return `plagiarism:checks:${projectId}:${promotionId}`;
    }

    return undefined;
  }
}
