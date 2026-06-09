<!--
  通用 CRUD 表格组件
  ------------------
  - 内嵌搜索栏（inline 表单）+ Element Plus 表格 + 分页
  - 通过 props 配置列、搜索项与 api，使业务页只关心数据形状
  - 暴露 slots：
      actions          —— 操作列内容，会得到 row / $index 等作用域
      column-{prop}    —— 自定义某列的渲染
      search-{prop}    —— 自定义某个搜索控件
  - 暴露事件：add / edit / delete / selection-change
-->
<template>
  <div class="crud-table">
    <!-- 搜索栏：仅当存在 searchItems 或 showAddButton 时渲染 -->
    <div v-if="searchItems?.length || showAddButton" class="crud-toolbar">
      <el-form v-if="searchItems?.length" :inline="true" :model="query" class="crud-search">
        <el-form-item v-for="item in searchItems" :key="item.prop" :label="item.label">
          <!-- 优先使用具名 slot 自定义搜索控件 -->
          <slot :name="`search-${item.prop}`" :query="query" :item="item">
            <!-- 输入框 -->
            <el-input
              v-if="!item.type || item.type === 'input'"
              v-model="(query as Record<string, any>)[item.prop]"
              :placeholder="item.placeholder || `请输入${item.label}`"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
            <!-- 下拉框 -->
            <el-select
              v-else-if="item.type === 'select'"
              v-model="(query as Record<string, any>)[item.prop]"
              :placeholder="item.placeholder || `请选择${item.label}`"
              clearable
              style="width: 180px"
            >
              <el-option
                v-for="opt in item.options || []"
                :key="String(opt.value)"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <!-- 日期选择 -->
            <el-date-picker
              v-else-if="item.type === 'date'"
              v-model="(query as Record<string, any>)[item.prop]"
              type="date"
              :placeholder="item.placeholder || `请选择${item.label}`"
              value-format="YYYY-MM-DD"
              style="width: 180px"
            />
          </slot>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetAll">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 右侧操作区：新增按钮 + 自定义工具栏 slot -->
      <div class="crud-toolbar-right">
        <slot name="toolbar" />
        <el-button v-if="showAddButton" type="primary" @click="emit('add')">
          {{ addButtonText }}
        </el-button>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      stripe
      border
      style="width: 100%"
      @selection-change="onSelectionChange"
    >
      <!-- 多选列（仅当 selectable=true 时出现） -->
      <el-table-column v-if="selectable" type="selection" width="46" />

      <!-- 业务列 -->
      <el-table-column
        v-for="col in columns"
        :key="col.prop || col.label"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align || 'left'"
        :show-overflow-tooltip="col.showOverflowTooltip !== false"
        :fixed="col.fixed"
      >
        <template #default="scope">
          <!-- 自定义列 slot 优先 -->
          <slot
            v-if="$slots[`column-${col.prop}`]"
            :name="`column-${col.prop}`"
            :row="scope.row"
            :$index="scope.$index"
          />
          <!-- 默认渲染原始字段 -->
          <template v-else>{{ scope.row[col.prop as string] }}</template>
        </template>
      </el-table-column>

      <!-- 操作列：仅当存在 actions slot 时渲染 -->
      <el-table-column
        v-if="$slots.actions"
        label="操作"
        :width="actionWidth"
        :fixed="actionFixed"
        align="center"
      >
        <template #default="scope">
          <slot name="actions" :row="scope.row" :$index="scope.$index" />
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="crud-pagination">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="pageSizes"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { onMounted, watch } from 'vue'
import type { AxiosResponse } from 'axios'
import type { PageResponse } from '@nodeadmin/shared'
import { useCrud } from '../composables/useCrud'
import type { ColumnConfig, SearchItemConfig } from '../types/table'

/** CRUD 接口约定 */
export interface CrudApi<TItem> {
  /** 列表查询：必填 */
  list: (
    params: Record<string, unknown> & { page: number; size: number },
  ) => Promise<AxiosResponse<PageResponse<TItem>>>
}

/** Props 定义（T 来自 script generic） */
interface Props {
  /** 表格列配置 */
  columns: ColumnConfig[]
  /** API 集合（仅 list 必填，其它由业务页直接调用） */
  api: CrudApi<T>
  /** 搜索项配置 */
  searchItems?: SearchItemConfig[]
  /** 是否显示新增按钮 */
  showAddButton?: boolean
  /** 新增按钮文案 */
  addButtonText?: string
  /** 操作列宽度 */
  actionWidth?: string | number
  /** 操作列固定 */
  actionFixed?: boolean | 'left' | 'right'
  /** 分页可选每页条数 */
  pageSizes?: number[]
  /** 是否多选 */
  selectable?: boolean
  /** 初始每页条数 */
  defaultSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  searchItems: () => [],
  showAddButton: true,
  addButtonText: '新增',
  actionWidth: 220,
  actionFixed: 'right',
  pageSizes: () => [10, 20, 50, 100],
  selectable: false,
  defaultSize: 10,
})

/** 事件定义 */
const emit = defineEmits<{
  /** 点击新增按钮 */
  (e: 'add'): void
  /** 选择行变化 */
  (e: 'selection-change', rows: T[]): void
}>()

// 使用 useCrud 组合式函数承担列表加载、分页、搜索
const {
  tableData,
  loading,
  total,
  query,
  loadData,
  handlePageChange,
  handleSizeChange,
  handleSearch,
  handleReset,
} = useCrud<T>(props.api.list, { defaultSize: props.defaultSize })

// 将业务的搜索项字段动态挂到 query 上，避免「未定义字段」响应性问题
for (const item of props.searchItems) {
  if (!(item.prop in query)) {
    ;(query as Record<string, unknown>)[item.prop] = ''
  }
}

/**
 * 重置：清空所有搜索项并重新加载
 * 在 useCrud.handleReset 基础上额外清空业务字段
 */
function handleResetAll(): void {
  for (const item of props.searchItems) {
    ;(query as Record<string, unknown>)[item.prop] = ''
  }
  handleReset()
}

/** 多选变化转发 */
function onSelectionChange(rows: T[]): void {
  emit('selection-change', rows)
}

// 监听 api.list 引用变化（如外部切换 api），重置后重新加载
watch(
  () => props.api.list,
  () => {
    query.page = 1
    loadData()
  },
)

// 暴露给父组件：刷新当前页 / 重新加载首页
defineExpose({
  /** 重新加载当前页（增删改后刷新用） */
  reload: loadData,
  /** 跳到第一页重新加载 */
  reset: handleResetAll,
  /** 暴露 query 用于业务页定制 */
  query,
})

// 首次挂载触发一次查询
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.crud-table {
  background: var(--na-bg-container);
  padding: 16px;
  border-radius: 6px;
  border: 1px solid var(--na-border-lighter);
}

.crud-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 12px;
  gap: 8px;
}

.crud-search :deep(.el-form-item) {
  margin-bottom: 8px;
  margin-right: 12px;
}

.crud-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.crud-pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
