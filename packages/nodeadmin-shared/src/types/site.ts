/**
 * 站点配置类型定义
 * 存储在 options 表中，key='site_config'
 */

/** 布局宽度选项 */
export type LayoutWidth = 'default' | 'compact'

/** 站点完整配置（管理员可见） */
export interface SiteConfig {
  /** 平台标题（浏览器标签、登录页、Header） */
  title: string
  /** 登录页背景图相对路径（如 /uploads/login-bg/20260609/abc.png）；为空表示使用默认渐变 */
  loginBg: string
  /** 布局宽度模式：default=默认（header 70px + sidebar 250px），compact=紧凑（header 50px + sidebar 160px） */
  layoutWidth: LayoutWidth
}

/** 站点公开配置（登录页可用） */
export interface SiteConfigPublic {
  /** 平台标题 */
  title: string
  /** 登录页背景图 URL */
  loginBg: string
  /** 布局宽度模式 */
  layoutWidth: LayoutWidth
}

/** 更新站点配置请求体 */
export interface UpdateSiteDto {
  /** 平台标题（1-50 字符） */
  title?: string
  /** 登录页背景图相对路径（传空字符串表示清除） */
  loginBg?: string
  /** 布局宽度模式 */
  layoutWidth?: LayoutWidth
}
