/**
 * 定时任务处理器注册表（CronHandlerRegistry）
 *
 * 集中管理所有可用的任务处理器。
 * 新增任务类型时，只需调用 register() 注册一个 handler 即可，
 * 调度引擎通过 handler 名称查找并执行对应的处理函数。
 *
 * 使用方式：
 *   1. 在构造函数中注册内置处理器
 *   2. 外部模块可通过 register() 动态注册新处理器
 *   3. 通过 getHandler() 获取处理器执行函数
 */
import { Injectable, Logger } from '@nestjs/common'

/** 处理器函数类型：接收可选的 JSON 参数，返回执行结果 */
export type CronHandlerFn = (params?: Record<string, unknown>) => Promise<string>

/** 处理器注册项 */
interface HandlerEntry {
  /** 处理器执行函数 */
  fn: CronHandlerFn
  /** 处理器描述 */
  description: string
}

@Injectable()
export class CronHandlerRegistry {
  private readonly logger = new Logger(CronHandlerRegistry.name)

  /** 处理器注册表：handler 名称 → 注册项 */
  private readonly handlers = new Map<string, HandlerEntry>()

  constructor() {
    // 注册内置处理器
    this.register('demoHello', this.demoHello.bind(this), '示例任务：输出问候语')
    this.register(
      'cleanExpiredLogs',
      this.cleanExpiredLogs.bind(this),
      '清理过期的定时任务执行日志',
    )
  }

  /**
   * 注册一个任务处理器
   *
   * @param name        处理器名称（唯一标识）
   * @param fn          处理器执行函数
   * @param description 处理器描述（用于前端展示）
   */
  register(name: string, fn: CronHandlerFn, description: string): void {
    if (this.handlers.has(name)) {
      this.logger.warn(`处理器「${name}」已被注册，将被覆盖`)
    }
    this.handlers.set(name, { fn, description })
  }

  /**
   * 获取处理器执行函数
   *
   * @param name 处理器名称
   * @returns 处理器执行函数，未找到时返回 undefined
   */
  getHandler(name: string): CronHandlerFn | undefined {
    return this.handlers.get(name)?.fn
  }

  /**
   * 获取所有已注册的处理器信息（供前端选择器使用）
   */
  getHandlerList(): Array<{ name: string; description: string }> {
    return Array.from(this.handlers.entries()).map(([name, entry]) => ({
      name,
      description: entry.description,
    }))
  }

  /**
   * 检查处理器是否已注册
   */
  hasHandler(name: string): boolean {
    return this.handlers.has(name)
  }

  // ============ 内置处理器实现 ============

  /**
   * 示例处理器：输出问候语
   * 用于测试定时任务调度是否正常工作
   */
  private async demoHello(params?: Record<string, unknown>): Promise<string> {
    const name = (params?.name as string) || 'World'
    const message = `Hello, ${name}! 当前时间：${new Date().toLocaleString('zh-CN')}`
    this.logger.log(message)
    return message
  }

  /**
   * 清理过期的定时任务执行日志
   * 默认清理 30 天前的日志记录
   */
  private async cleanExpiredLogs(params?: Record<string, unknown>): Promise<string> {
    // 注意：这里需要通过返回信息来标记，实际删除在 CronService 中执行
    const days = (params?.days as number) || 30
    return `CLEAN_LOGS:${days}`
  }
}
