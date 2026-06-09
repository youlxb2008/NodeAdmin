/**
 * @Public() 装饰器
 * 标记不需要 JWT 认证的路由（公开接口，如登录 / 初始化状态查询）
 */
import { SetMetadata } from '@nestjs/common'

/** 元数据 key — 守卫读取此 key 判断是否豁免认证 */
export const IS_PUBLIC_KEY = 'isPublic'

/** 标记当前路由 / 控制器为公开访问 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
