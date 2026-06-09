/**
 * @CurrentUser() 装饰器
 * 从 request 对象中提取当前登录用户信息（由 JwtAccessGuard / AccessStrategy 注入）
 *
 * 用法示例：
 *   handler(@CurrentUser() user: any)            // 取整个 user 对象
 *   handler(@CurrentUser('id') userId: number)   // 仅取某个字段
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  const user = request.user
  // 传入字段名则只返回该字段，否则返回整个 user 对象
  return data ? user?.[data] : user
})
