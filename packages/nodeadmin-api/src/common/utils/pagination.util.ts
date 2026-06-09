/**
 * 分页查询助手
 *
 * 封装 TypeORM SelectQueryBuilder 的常见分页调用，
 * 让 Service 层无需重复 skip/take/getManyAndCount 模板代码。
 *
 * 返回结构与 @nodeadmin/shared 的 PageResponse 对齐（少了 code/message，
 * 由 Controller 通过 successPage 包装）。
 */
import { SelectQueryBuilder, ObjectLiteral } from 'typeorm'

/** 分页结果（数据 + 元信息） */
export interface PageResult<T> {
  /** 当前页数据列表 */
  data: T[]
  /** 总记录数 */
  total: number
  /** 当前页码（1-based） */
  page: number
  /** 每页条数 */
  size: number
}

/**
 * 通用分页执行函数
 *
 * @param qb     已构造好 where / orderBy 的 QueryBuilder
 * @param page   当前页码（< 1 时归一化为 1）
 * @param size   每页条数（< 1 时归一化为 10）
 * @returns      统一分页结果对象
 */
export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  page: number,
  size: number,
): Promise<PageResult<T>> {
  // 归一化分页参数，避免 NaN / 负数导致 SQL 异常
  const safePage = page && page > 0 ? page : 1
  const safeSize = size && size > 0 ? size : 10

  const [data, total] = await qb
    .skip((safePage - 1) * safeSize)
    .take(safeSize)
    .getManyAndCount()

  return { data, total, page: safePage, size: safeSize }
}
