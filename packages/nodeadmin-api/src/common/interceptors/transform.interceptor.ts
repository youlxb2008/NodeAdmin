/**
 * 响应转换拦截器
 *
 * 将 Controller 返回的"裸数据"自动包装为 `{ code: 0, data }` 统一格式；
 * 如果 Controller 已经自行返回带 `code` 字段的对象（例如分页响应），
 * 则透传不再二次包装。
 */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable, map } from 'rxjs'

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { code: number; data: T }> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<{ code: number; data: T }> {
    return next.handle().pipe(
      map(data => {
        // 已是统一格式（含 code 字段）则直接返回，避免重复包装
        if (data && typeof data === 'object' && 'code' in data) return data
        return { code: 0, data }
      }),
    )
  }
}
