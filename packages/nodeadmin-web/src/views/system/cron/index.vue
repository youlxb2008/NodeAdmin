<!--
  定时任务管理
  -----------
  任务列表基于 CrudTable 组件，支持搜索、新增/编辑弹窗、启用/暂停切换、
  手动触发、删除，以及执行日志抽屉。
-->
<template>
  <div>
    <CrudTable
      ref="crudRef"
      :columns="columns"
      :api="{ list: getCronJobList }"
      :search-items="searchItems"
      show-add-button
      add-button-text="新增任务"
      :action-width="320"
      @add="openCreateDialog"
    >
      <!-- 状态列 -->
      <template #column-status="{ row }">
        <el-switch
          :model-value="row.status === 1"
          active-text="运行"
          inactive-text="暂停"
          inline-prompt
          v-permiss="'system:cron:update'"
          @change="handleToggleStatus(row)"
        />
      </template>

      <!-- Cron 表达式列 -->
      <template #column-cronExpression="{ row }">
        <el-tooltip :content="parseCronDesc(row.cronExpression)" placement="top">
          <code class="cron-code">{{ row.cronExpression }}</code>
        </el-tooltip>
      </template>

      <!-- 最后执行时间列 -->
      <template #column-lastExecuteTime="{ row }">
        {{ formatTime(row.lastExecuteTime) }}
      </template>

      <!-- 下次执行时间列 -->
      <template #column-nextExecuteTime="{ row }">
        {{ formatTime(row.nextExecuteTime) }}
      </template>

      <!-- 操作列 -->
      <template #actions="{ row }">
        <el-button
          v-permiss="'system:cron:trigger'"
          text
          type="success"
          size="small"
          @click="handleTrigger(row)"
        >
          执行一次
        </el-button>
        <el-button
          v-permiss="'system:cron:update'"
          text
          type="primary"
          size="small"
          @click="openEditDialog(row)"
        >
          编辑
        </el-button>
        <el-button
          v-permiss="'system:cron:list'"
          text
          type="info"
          size="small"
          @click="openLogDrawer(row)"
        >
          日志
        </el-button>
        <el-button
          v-permiss="'system:cron:delete'"
          text
          type="danger"
          size="small"
          @click="handleDelete(row)"
        >
          删除
        </el-button>
      </template>
    </CrudTable>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEditing ? '编辑定时任务' : '新增定时任务'"
      width="560px"
      :close-on-click-modal="false"
      @closed="onFormClosed"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务分组" prop="group">
          <el-select v-model="form.group" placeholder="请选择分组" style="width: 100%">
            <el-option label="默认" value="default" />
            <el-option label="系统任务" value="system" />
            <el-option label="数据任务" value="data" />
            <el-option label="通知任务" value="notify" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务处理器" prop="handler">
          <el-select
            v-model="form.handler"
            placeholder="请选择处理器"
            style="width: 100%"
            :disabled="isEditing"
          >
            <el-option
              v-for="h in handlers"
              :key="h.name"
              :label="`${h.name}（${h.description}）`"
              :value="h.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Cron 表达式" prop="cronExpression">
          <el-input v-model="form.cronExpression" placeholder="如：0 0 2 * * *（每天凌晨2点）" />
          <div v-if="form.cronExpression" class="cron-hint">
            {{ parseCronDesc(form.cronExpression) }}
          </div>
        </el-form-item>
        <el-form-item label="任务参数">
          <el-input
            v-model="form.params"
            type="textarea"
            :rows="3"
            placeholder='JSON 格式，如 {"name": "test"}'
          />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            placeholder="任务说明（可选）"
          />
        </el-form-item>
        <el-form-item label="过期策略">
          <el-select v-model="form.misfirePolicy" style="width: 100%">
            <el-option label="立即执行" :value="1" />
            <el-option label="放弃执行" :value="2" />
            <el-option label="仅执行一次" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="允许并发">
          <el-switch v-model="form.concurrent" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 执行日志抽屉 -->
    <el-drawer
      v-model="logDrawerVisible"
      :title="`执行日志 - ${logJobName}`"
      size="700px"
      direction="rtl"
    >
      <!-- 日志搜索栏 -->
      <div class="log-toolbar">
        <el-select v-model="logQuery.status" placeholder="执行状态" clearable style="width: 140px">
          <el-option label="成功" :value="1" />
          <el-option label="失败" :value="0" />
          <el-option label="执行中" :value="2" />
        </el-select>
        <el-button type="primary" @click="loadLogs">查询</el-button>
        <el-button @click="handleClearLogs" type="danger" plain>清空日志</el-button>
      </div>

      <!-- 日志表格 -->
      <el-table v-loading="logLoading" :data="logData" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="startTime" label="执行时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 1 ? 'success' : row.status === 0 ? 'danger' : 'warning'"
              size="small"
            >
              {{ row.status === 1 ? '成功' : row.status === 0 ? '失败' : '执行中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="90" align="center">
          <template #default="{ row }">
            {{ row.duration !== null ? `${row.duration}ms` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="结果/错误" min-width="200">
          <template #default="{ row }">
            <div v-if="row.status === 0" class="log-error">{{ row.errorMessage }}</div>
            <div v-else class="log-result">{{ row.result || '-' }}</div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 日志分页 -->
      <div class="log-pagination">
        <el-pagination
          v-model:current-page="logQuery.page"
          v-model:page-size="logQuery.size"
          :total="logTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="loadLogs"
          @size-change="loadLogs"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getCronJobList,
  getCronHandlers,
  createCronJob,
  updateCronJob,
  deleteCronJob,
  toggleCronJobStatus,
  triggerCronJob,
  getCronLogs,
  clearCronLogs,
} from '@/api/cron'
import type { CronHandlerInfo, CronLog } from '@nodeadmin/shared'
import type { ColumnConfig, SearchItemConfig } from '@/types/table'

defineOptions({ name: 'system-cron' })

const crudRef = ref()

function reloadTable(): void {
  crudRef.value?.reload?.()
}

/* 列定义 */
const columns: ColumnConfig[] = [
  { prop: 'id', label: 'ID', width: 60 },
  { prop: 'name', label: '任务名称', minWidth: 130 },
  { prop: 'group', label: '分组', width: 100 },
  { prop: 'handler', label: '处理器', width: 140 },
  { prop: 'cronExpression', label: 'Cron 表达式', width: 140 },
  { prop: 'status', label: '状态', width: 100, align: 'center' },
  { prop: 'lastExecuteTime', label: '最后执行', width: 170 },
  { prop: 'nextExecuteTime', label: '下次执行', width: 170 },
]

/* 搜索项 */
const searchItems: SearchItemConfig[] = [
  { prop: 'name', label: '任务名称', type: 'input', placeholder: '任务名称' },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '启用', value: 1 },
      { label: '暂停', value: 0 },
    ],
  },
]

/* ========== 处理器列表 ========== */
const handlers = ref<CronHandlerInfo[]>([])

async function loadHandlers(): Promise<void> {
  try {
    const res = await getCronHandlers()
    handlers.value = res.data.data || []
  } catch {
    // 静默
  }
}

/* ========== 弹窗状态 ========== */
const formVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(0)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  group: 'default',
  cronExpression: '',
  handler: '',
  params: '',
  description: '',
  concurrent: 0,
  misfirePolicy: 1,
  status: 1,
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  cronExpression: [{ required: true, message: '请输入 Cron 表达式', trigger: 'blur' }],
  handler: [{ required: true, message: '请选择处理器', trigger: 'change' }],
}

function openCreateDialog(): void {
  isEditing.value = false
  editingId.value = 0
  Object.assign(form, {
    name: '',
    group: 'default',
    cronExpression: '',
    handler: '',
    params: '',
    description: '',
    concurrent: 0,
    misfirePolicy: 1,
    status: 1,
  })
  formVisible.value = true
}

function openEditDialog(row: Record<string, unknown>): void {
  isEditing.value = true
  editingId.value = row.id as number
  Object.assign(form, {
    name: row.name,
    group: row.group,
    cronExpression: row.cronExpression,
    handler: row.handler,
    params: row.params || '',
    description: row.description || '',
    concurrent: row.concurrent ?? 0,
    misfirePolicy: row.misfirePolicy ?? 1,
    status: row.status ?? 1,
  })
  formVisible.value = true
}

function onFormClosed(): void {
  formRef.value?.resetFields()
}

async function handleSave(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = {
      name: form.name,
      group: form.group,
      cronExpression: form.cronExpression,
      handler: form.handler,
      params: form.params || undefined,
      description: form.description || undefined,
      concurrent: form.concurrent,
      misfirePolicy: form.misfirePolicy,
      status: form.status,
    }
    if (isEditing.value) {
      await updateCronJob(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createCronJob(payload)
      ElMessage.success('创建成功')
    }
    formVisible.value = false
    reloadTable()
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}

/* ========== 状态切换 ========== */
async function handleToggleStatus(row: Record<string, unknown>): Promise<void> {
  try {
    await toggleCronJobStatus(row.id as number)
    ElMessage.success(row.status === 1 ? '已暂停' : '已启用')
    reloadTable()
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败'
    ElMessage.error(msg)
  }
}

/* ========== 手动触发 ========== */
async function handleTrigger(row: Record<string, unknown>): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认手动执行一次「${row.name}」？`, '手动执行', {
      confirmButtonText: '确认执行',
      cancelButtonText: '取消',
      type: 'info',
    })
    const res = await triggerCronJob(row.id as number)
    const log = res.data.data
    if (!log) {
      ElMessage.info('任务已触发')
    } else if (log.status === 1) {
      ElMessage.success(`执行成功，耗时 ${log.duration}ms`)
    } else if (log.status === 0) {
      ElMessage.error(`执行失败：${log.errorMessage}`)
    } else {
      ElMessage.info('任务已触发，正在执行中')
    }
    reloadTable()
  } catch {
    // 用户取消或请求失败
  }
}

/* ========== 删除 ========== */
async function handleDelete(row: Record<string, unknown>): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认删除任务「${row.name}」？`, '警告', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteCronJob(row.id as number)
    ElMessage.success('删除成功')
    reloadTable()
  } catch {
    // 静默
  }
}

/* ========== 执行日志抽屉 ========== */
const logDrawerVisible = ref(false)
const logJobId = ref(0)
const logJobName = ref('')
const logLoading = ref(false)
const logData = ref<CronLog[]>([])
const logTotal = ref(0)
const logQuery = reactive({ page: 1, size: 10, status: undefined as number | undefined })

function openLogDrawer(row: Record<string, unknown>): void {
  logJobId.value = row.id as number
  logJobName.value = row.name as string
  logQuery.page = 1
  logQuery.status = undefined
  logDrawerVisible.value = true
  loadLogs()
}

async function loadLogs(): Promise<void> {
  logLoading.value = true
  try {
    const res = await getCronLogs(logJobId.value, {
      page: logQuery.page,
      size: logQuery.size,
      status: logQuery.status,
    })
    const d = res.data
    logData.value = d.data || []
    logTotal.value = d.total || 0
  } catch {
    // 静默
  } finally {
    logLoading.value = false
  }
}

async function handleClearLogs(): Promise<void> {
  try {
    await ElMessageBox.confirm('确认清空所有执行日志？此操作不可恢复。', '警告', {
      confirmButtonText: '确认清空',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await clearCronLogs(logJobId.value)
    ElMessage.success('日志已清空')
    loadLogs()
  } catch {
    // 静默
  }
}

/* ========== 工具函数 ========== */

/**
 * 格式化时间显示
 */
function formatTime(t: string | null): string {
  if (!t) return '-'
  try {
    return new Date(t).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return t
  }
}

/**
 * 简单解析 Cron 表达式为中文描述
 * 支持 6 位秒级表达式
 */
function parseCronDesc(expression: string): string {
  if (!expression) return ''
  const parts = expression.trim().split(/\s+/)
  if (parts.length < 6) return expression

  const [sec, min, hour, day, month, week] = parts

  // 每天
  if (day === '*' && month === '*' && week === '*') {
    if (min.startsWith('*/')) {
      return `每隔 ${min.slice(2)} 分钟执行`
    }
    if (hour.startsWith('*/')) {
      return `每隔 ${hour.slice(2)} 小时执行`
    }
    if (sec === '0' && min !== '*' && hour !== '*') {
      return `每天 ${hour.padStart(2, '0')}:${min.padStart(2, '0')}:${sec.padStart(2, '0')} 执行`
    }
  }

  // 每周
  if (week !== '*' && day === '*' && month === '*') {
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const weekIdx = parseInt(week, 10)
    if (!isNaN(weekIdx) && weekIdx >= 0 && weekIdx <= 6) {
      return `每周${weekDays[weekIdx]} ${hour.padStart(2, '0')}:${min.padStart(2, '0')} 执行`
    }
  }

  return expression
}

// 加载处理器列表
onMounted(() => {
  loadHandlers()
})
</script>

<style scoped>
.cron-code {
  background: var(--el-fill-color-light);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-family: 'Courier New', Courier, monospace;
}

.cron-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.log-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
}

.log-pagination {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.log-error {
  color: var(--el-color-danger);
  font-size: 12px;
}

.log-result {
  color: var(--el-text-color-regular);
  font-size: 12px;
}
</style>
