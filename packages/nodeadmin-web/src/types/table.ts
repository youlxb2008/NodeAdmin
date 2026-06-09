/**
 * 通用表格 / 搜索表单类型定义
 *
 * 拆分到独立模块，避免业务页直接 import .vue 组件造成的类型解析负担。
 * 业务页可通过 `import type { ColumnConfig, SearchItemConfig } from '@/types/table'` 使用。
 */

/** 表格列配置 */
export interface ColumnConfig {
  /** 字段名（与表格数据 row 字段对应） */
  prop?: string
  /** 列头文案 */
  label: string
  /** 固定宽度（px） */
  width?: string | number
  /** 最小宽度（px） */
  minWidth?: string | number
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 是否启用 overflow tooltip，默认 true */
  showOverflowTooltip?: boolean
  /** 是否固定列 */
  fixed?: boolean | 'left' | 'right'
}

/** 搜索项控件类型 */
export type SearchItemType = 'input' | 'select' | 'date'

/** 搜索项配置 */
export interface SearchItemConfig {
  /** 字段名（与 query 字段对应） */
  prop: string
  /** 表单 label */
  label: string
  /** 控件类型，默认 input */
  type?: SearchItemType
  /** 占位符 */
  placeholder?: string
  /** select 选项集合 */
  options?: Array<{ label: string; value: string | number }>
}
