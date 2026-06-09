import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { AxiosResponse } from 'axios'
import type { PageResponse } from '@nodeadmin/shared'

/**
 * useCrud 选项
 */
export interface UseCrudOptions {
  /** 初始关键字 */
  keyword?: string
  /** 默认每页条数，默认 10 */
  defaultSize?: number
}

/**
 * CRUD 列表 API 约定
 *
 * 必须接收形如 { page, size, keyword } 的查询参数并返回 PageResponse
 */
export type CrudListApi<T> = (params: {
  page: number
  size: number
  keyword?: string
  [key: string]: unknown
}) => Promise<AxiosResponse<PageResponse<T>>>

/**
 * 通用 CRUD 列表组合式函数
 *
 * 封装常见的「表格 + 分页 + 关键字搜索」交互，减少业务页样板。
 *
 * @typeParam T 列表项类型
 * @param api 列表查询接口
 * @param options 配置项
 */
export function useCrud<T = unknown>(api: CrudListApi<T>, options: UseCrudOptions = {}) {
  /** 表格数据 */
  const tableData = ref<T[]>([]) as { value: T[] }
  /** 加载状态 */
  const loading = ref(false)
  /** 总记录数 */
  const total = ref(0)

  /** 查询条件（page / size / keyword） */
  const query = reactive({
    page: 1,
    size: options.defaultSize ?? 10,
    keyword: options.keyword ?? '',
  })

  /**
   * 加载数据（依据 query 当前值）
   */
  async function loadData(): Promise<void> {
    loading.value = true
    try {
      const res = await api({ ...query })
      // PageResponse 直接挂在 res.data 上
      tableData.value = res.data.data || []
      total.value = res.data.total || 0
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || '加载失败'
      ElMessage.error(msg)
    } finally {
      loading.value = false
    }
  }

  /** 翻页 */
  function handlePageChange(page: number): void {
    query.page = page
    loadData()
  }

  /** 调整每页条数 */
  function handleSizeChange(size: number): void {
    query.size = size
    query.page = 1
    loadData()
  }

  /** 关键字搜索（重置到第一页） */
  function handleSearch(): void {
    query.page = 1
    loadData()
  }

  /** 重置查询条件 */
  function handleReset(): void {
    query.keyword = ''
    query.page = 1
    loadData()
  }

  return {
    tableData,
    loading,
    total,
    query,
    loadData,
    handlePageChange,
    handleSizeChange,
    handleSearch,
    handleReset,
  }
}
