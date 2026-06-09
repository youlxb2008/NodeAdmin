<!--
  字典管理
  --------
  CRUD 基于 CrudTable 组件：id / type / label / value / sort / status / createdAt / 操作
  搜索栏：type（input）+ status（select）
-->
<template>
  <div>
    <CrudTable
      ref="crudRef"
      :columns="columns"
      :api="{ list: getDictList }"
      :search-items="searchItems"
      show-add-button
      add-button-text="新增字典项"
      @add="openCreateDialog"
    >
      <!-- 状态列 -->
      <template #column-status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
          {{ row.status === 1 ? '启用' : '禁用' }}
        </el-tag>
      </template>

      <!-- 时间列 -->
      <template #column-createdAt="{ row }">
        {{ formatTime(row.createdAt) }}
      </template>

      <!-- 操作列 -->
      <template #actions="{ row }">
        <el-button
          v-permiss="'system:dict:update'"
          text
          type="primary"
          size="small"
          @click="openEditDialog(row)"
        >
          编辑
        </el-button>
        <el-button
          v-permiss="'system:dict:delete'"
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
      :title="isEditing ? '编辑字典项' : '新增字典项'"
      width="480px"
      :close-on-click-modal="false"
      @closed="onFormClosed"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="类型" prop="type">
          <el-input v-model="form.type" placeholder="字典类型编码（如 user_gender）" />
        </el-form-item>
        <el-form-item label="标签" prop="label">
          <el-input v-model="form.label" placeholder="显示文本（如 男）" />
        </el-form-item>
        <el-form-item label="取值" prop="value">
          <el-input v-model="form.value" placeholder="实际取值（如 1）" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getDictList, createDict, updateDict, deleteDict } from '@/api/dict'
import type { ColumnConfig, SearchItemConfig } from '@/types/table'

defineOptions({ name: 'system-dict' })

const crudRef = ref()

function reloadTable(): void {
  crudRef.value?.reload?.()
}

/* 列定义 */
const columns: ColumnConfig[] = [
  { prop: 'id', label: 'ID', width: 60 },
  { prop: 'type', label: '类型', width: 150 },
  { prop: 'label', label: '标签', width: 130 },
  { prop: 'value', label: '取值', width: 130 },
  { prop: 'sort', label: '排序', width: 70, align: 'center' },
  { prop: 'status', label: '状态', width: 80, align: 'center' },
  { prop: 'createdAt', label: '创建时间', width: 170 },
]

/* 搜索项 */
const searchItems: SearchItemConfig[] = [
  { prop: 'type', label: '类型', type: 'input', placeholder: '字典类型编码' },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
]

/* ========== 弹窗状态 ========== */
const formVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(0)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  type: '',
  label: '',
  value: '',
  sort: 0,
  status: 1,
  remark: '',
})

const formRules: FormRules = {
  type: [{ required: true, message: '请输入字典类型编码', trigger: 'blur' }],
  label: [{ required: true, message: '请输入标签', trigger: 'blur' }],
  value: [{ required: true, message: '请输入取值', trigger: 'blur' }],
}

function openCreateDialog(): void {
  isEditing.value = false
  editingId.value = 0
  Object.assign(form, { type: '', label: '', value: '', sort: 0, status: 1, remark: '' })
  formVisible.value = true
}

function openEditDialog(row: {
  id: number
  type: string
  label: string
  value: string
  sort: number
  status: number
  remark: string
}): void {
  isEditing.value = true
  editingId.value = row.id
  Object.assign(form, {
    type: row.type,
    label: row.label,
    value: row.value,
    sort: row.sort ?? 0,
    status: row.status ?? 1,
    remark: row.remark || '',
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
    if (isEditing.value) {
      await updateDict(editingId.value, {
        type: form.type,
        label: form.label,
        value: form.value,
        sort: form.sort,
        status: form.status,
      })
      ElMessage.success('更新成功')
    } else {
      await createDict({
        type: form.type,
        label: form.label,
        value: form.value,
        sort: form.sort,
        status: form.status,
      })
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

/* ========== 删除 ========== */
async function handleDelete(row: { id: number; label: string }): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认删除字典项「${row.label}」？`, '警告', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteDict(row.id)
    ElMessage.success('删除成功')
    reloadTable()
  } catch {
    // 静默
  }
}

function formatTime(t: string): string {
  if (!t) return ''
  try {
    return new Date(t).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return t
  }
}
</script>
