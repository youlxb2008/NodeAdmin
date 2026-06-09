/**
 * 请求日志中间件
 *
 * 在请求开始时打印 method / URL / IP / UA；
 * 在响应结束时打印状态码 / 耗时 / 用户名，并对状态码做终端颜色着色。
 */
import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req
    const userAgent = req.get('user-agent') || '-'
    const start = Date.now()
    // 用 8 位随机串关联同一请求的"开始"与"结束"两条日志
    const requestId = Math.random().toString(36).slice(2, 10)

    // 入口日志
    this.logger.debug(`[${requestId}] --> ${method} ${originalUrl} from ${ip} | ${userAgent}`)

    // 监听响应结束事件
    res.on('finish', () => {
      const { statusCode } = res
      const duration = Date.now() - start
      const user = (req as any).user as { username?: string } | undefined
      const username = user?.username ?? '-'

      // 状态码 ANSI 着色，方便在终端肉眼区分成功/失败
      const statusStr =
        statusCode >= 500
          ? `\x1b[31m${statusCode}\x1b[0m` // 红色：服务端错误
          : statusCode >= 400
            ? `\x1b[33m${statusCode}\x1b[0m` // 黄色：客户端错误
            : statusCode >= 300
              ? `\x1b[36m${statusCode}\x1b[0m` // 青色：重定向
              : `\x1b[32m${statusCode}\x1b[0m` // 绿色：成功

      // 4xx/5xx 用 warn 级别；其他用 log 级别
      const prefix = statusCode >= 400 ? 'warn' : 'log'
      const logFn = this.logger[prefix as 'log' | 'warn']

      logFn.call(
        this.logger,
        `[${requestId}] <-- ${method} ${originalUrl} ${statusStr} ${duration}ms user:${username}`,
      )
    })

    next()
  }
}
