<!--
  角色管理
  --------
  使用 PageHeader + CrudTable + 弹窗实现角色 CRUD。
  额外支持分配菜单权限。
-->
<template>
  <div>
    <CrudTable
      ref="crudRef"
      :columns="columns"
      :api="{ list: getRoleList }"
      :search-items="searchItems"
      show-add-button
      add-button-text="新增角色"
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
          v-permiss="'system:role:update'"
          text
          type="primary"
          size="small"
          @click="openEditDialog(row)"
        >
          编辑
        </el-button>
        <el-button
          v-permiss="'system:role:assignMenus'"
          text
          type="warning"
          size="small"
          @click="openAssignMenuDialog(row)"
        >
          分配菜单
        </el-button>
        <el-button
          v-permiss="'system:role:delete'"
          text
          type="danger"
          size="small"
          :disabled="row.code === 'super_admin'"
          @click="handleDelete(row)"
        >
          删除
        </el-button>
      </template>
    </CrudTable>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEditing ? '编辑角色' : '新增角色'"
      width="480px"
      :close-on-click-modal="false"
      @closed="onFormClosed"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="角色名称（如 系统管理员）" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input
            v-model="form.code"
            placeholder="角色编码（如 admin，全局唯一）"
            :disabled="isEditing"
          />
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

    <!-- 分配菜单弹窗 -->
    <AssignMenuDialog
      v-model:visible="assignMenuVisible"
      :role-id="selectedRoleId"
      @done="onAssignMenuDone"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getRoleList, createRole, updateRole, deleteRole } from '@/api/role'
import type { ColumnConfig, SearchItemConfig } from '@/types/table'
import AssignMenuDialog from './AssignMenuDialog.vue'

defineOptions({ name: 'system-role' })

const crudRef = ref()

/** 刷新表格 */
function reloadTable(): void {
  crudRef.value?.reload?.()
}

/* 列定义 */
const columns: ColumnConfig[] = [
  { prop: 'id', label: 'ID', width: 60 },
  { prop: 'code', label: '编码', width: 130 },
  { prop: 'name', label: '名称', minWidth: 140 },
  { prop: 'sort', label: '排序', width: 70, align: 'center' },
  { prop: 'status', label: '状态', width: 80, align: 'center' },
  { prop: 'createdAt', label: '创建时间', width: 170 },
]

/* 搜索项 */
const searchItems: SearchItemConfig[] = [
  { prop: 'keyword', label: '关键字', type: 'input', placeholder: '角色名称 / 编码' },
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
  name: '',
  code: '',
  sort: 0,
  status: 1,
  remark: '',
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
}

function openCreateDialog(): void {
  isEditing.value = false
  editingId.value = 0
  Object.assign(form, { name: '', code: '', sort: 0, status: 1, remark: '' })
  formVisible.value = true
}

function openEditDialog(row: {
  id: number
  name: string
  code: string
  sort: number
  status: number
  remark: string
}): void {
  isEditing.value = true
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    code: row.code,
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
      await updateRole(editingId.value, {
        name: form.name,
        sort: form.sort,
        status: form.status,
        remark: form.remark || undefined,
      })
      ElMessage.success('更新成功')
    } else {
      await createRole({
        name: form.name,
        code: form.code,
        sort: form.sort,
        status: form.status,
        remark: form.remark || undefined,
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
async function handleDelete(row: { id: number; name: string }): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认删除角色「${row.name}」？`, '警告', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteRole(row.id)
    ElMessage.success('删除成功')
    reloadTable()
  } catch {
    // 静默
  }
}

/* ========== 分配菜单 ========== */
const assignMenuVisible = ref(false)
const selectedRoleId = ref(0)

function openAssignMenuDialog(row: { id: number }): void {
  selectedRoleId.value = row.id
  assignMenuVisible.value = true
}

function onAssignMenuDone(): void {
  reloadTable()
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
