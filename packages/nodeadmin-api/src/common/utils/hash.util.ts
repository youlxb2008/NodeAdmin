/**
 * 密码哈希工具
 * 使用 bcryptjs 进行密码哈希和比对，统一 saltRounds 配置
 */
import * as bcrypt from 'bcryptjs'

/** bcrypt 加盐轮数（10 在安全性与性能之间取得平衡） */
const SALT_ROUNDS = 10

/**
 * 对明文密码进行 bcrypt 哈希
 * @param password 明文密码
 * @returns 带 salt 的哈希字符串（可直接入库）
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * 比对明文密码与数据库中的哈希值
 * @param password 用户输入的明文密码
 * @param hash    数据库中的哈希字符串
 * @returns true=密码正确
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
