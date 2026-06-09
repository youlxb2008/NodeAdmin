/**
 * Token 过期时间解析工具
 * 统一处理 JWT_ACCESS_EXPIRES_IN 的解析逻辑：
 *   - 纯数字字符串（'604800'）→ 直接按秒返回
 *   - 带单位字符串（'7d' / '1h' / '15m' / '30s'）→ 解析为秒
 *   - 未配置或格式异常 → 使用调用方提供的默认秒数
 */

/**
 * 解析 access token 过期时间为秒数
 * @param defaultSeconds 解析失败 / 未配置时的兜底值
 */
export function parseAccessExpiresInSeconds(defaultSeconds: number): number {
  const raw = process.env.JWT_ACCESS_EXPIRES_IN
  if (!raw) return defaultSeconds
  // 纯数字字符串：直接当作秒
  if (/^\d+$/.test(raw)) return parseInt(raw, 10)

  // 带单位字符串：支持 s/m/h/d 四种单位
  const match = raw.match(/^(\d+)(s|m|h|d)$/)
  if (!match) return defaultSeconds
  const value = parseInt(match[1], 10)
  const unitMap: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 }
  return value * (unitMap[match[2]] || 1)
}
