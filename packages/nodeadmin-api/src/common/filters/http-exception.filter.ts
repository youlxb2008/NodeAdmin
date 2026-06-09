/**
 * 全局 HTTP 异常过滤器
 *
 * 捕获所有未被处理的异常，统一返回 `{ code, message }` JSON 格式；
 * 开发环境额外打印异常堆栈，便于排查。
 */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    // 默认按 500 / 业务码 2000 兜底
    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let code = 2000
    let message = '服务器内部错误'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exResponse = exception.getResponse()
      if (typeof exResponse === 'object' && exResponse !== null) {
        const resp = exResponse as Record<string, unknown>
        message = (resp.message as string) || exception.message
        // class-validator 的验证错误 message 是数组，拼接为单行字符串
        if (Array.isArray(resp.message)) {
          message = resp.message.join('; ')
        }
      } else {
        message = exception.message
      }
      code = status
    }

    // 开发环境输出详细堆栈，生产环境只记录摘要
    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev) {
      this.logger.warn(
        `[${request.method} ${request.url}] ${status} | ${message}` +
          (exception instanceof Error ? `\n  ${exception.stack}` : ''),
      )
    } else {
      this.logger.warn(`[${request.method} ${request.url}] ${status} | ${message}`)
    }

    response.status(status).json({ code, message })
  }
}
