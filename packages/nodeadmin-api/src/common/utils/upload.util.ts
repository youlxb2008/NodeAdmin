/**
 * 文件上传工具类
 *
 * 提供上传目录管理、目录创建、文件名生成、图片扩展名解析等通用能力。
 * 头像存储路径格式：uploads/avatar/YYYYMMDD/<sha256前16位>.<ext>
 */
import * as path from 'path'
import * as fs from 'fs'
import * as crypto from 'crypto'

/**
 * 返回上传根目录
 * 优先从环境变量 UPLOAD_DIR 读取，否则使用项目根目录下的 uploads 文件夹
 */
export function getUploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
}

/**
 * 递归创建目录
 * @param dir 目标目录路径
 */
export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * 根据文件内容生成 SHA256 哈希文件名（取前 16 位）
 * @param buffer 文件二进制内容
 * @returns 16 位十六进制字符串
 */
export function generateFileName(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 16)
}

/**
 * 根据 MIME 类型返回对应的图片扩展名
 * @param mimeType MIME 类型，如 image/png
 * @returns 带点号的扩展名，如 .png；不支持的类型返回空字符串
 */
export function getImageExt(mimeType: string): string {
  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  }
  return extMap[mimeType] || ''
}
