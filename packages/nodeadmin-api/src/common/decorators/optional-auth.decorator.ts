/**
 * @OptionalAuth() 装饰器
 * 标记"可选认证"路由：携带 token 则注入 user，缺失或过期则降级为访客
 * 适用于：公开接口需根据登录状态返回不同视图（如门户展示个人化内容）
 */
import { SetMetadata } from '@nestjs/common'

/** 元数据 key — JwtAccessGuard 读取此 key 决定走可选认证分支 */
export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth'

/** 标记当前路由 / 控制器为可选认证 */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true)
