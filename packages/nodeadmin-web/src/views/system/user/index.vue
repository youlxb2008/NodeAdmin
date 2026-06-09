<!--
  用户管理
  --------
  使用 PageHeader + CrudTable + 弹窗的方式演示通用 CRUD 组件。
  列含 id / username / nickname / email / roles / status / createdAt / 操作
-->
<template>
  <div>
    <!-- 表格 -->
    <CrudTable
      ref="crudRef"
      :columns="columns"
      :api="{ list: getUserList }"
      :search-items="searchItems"
      :action-width="280"
      show-add-button
      add-button-text="新增用户"
      @add="openCreateDialog"
    >
      <!-- 角色列：多个 el-tag -->
      <template #column-roles="{ row }">
        <el-tag
          v-for="role in row.roles || []"
          :key="role.id"
          size="small"
          style="margin-right: 4px"
        >
          {{ role.name }}
        </el-tag>
        <span v-if="!row.roles?.length" class="na-muted">未分配</span>
      </template>

      <!-- 状态列：el-switch（超管禁止切换） -->
      <template #column-status="{ row }">
        <el-switch
          :model-value="row.status === 1"
          :loading="statusLoadingMap[row.id]"
          :disabled="row.id === 1"
          @change="(val: boolean) => toggleStatus(row, val)"
        />
      </template>

      <!-- 创建时间格式化 -->
      <template #column-createdAt="{ row }">
        {{ formatTime(row.createdAt) }}
      </template>

      <!-- 操作列 -->
      <template #actions="{ row }">
        <el-button
          v-permiss="'system:user:update'"
          text
          type="primary"
          size="small"
          @click="openEditDialog(row)"
        >
          编辑
        </el-button>
        <el-button
          v-permiss="'system:user:assignRoles'"
          text
          type="warning"
          size="small"
          @click="openAssignRoleDialog(row)"
        >
          分配角色
        </el-button>
        <el-button
          v-permiss="'system:user:delete'"
          text
          type="danger"
          size="small"
          :disabled="row.id === 1"
          @click="handleDelete(row)"
        >
          删除
        </el-button>
      </template>
    </CrudTable>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEditing ? '编辑用户' : '新增用户'"
      width="520px"
      :close-on-click-modal="false"
      @closed="onFormClosed"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="登录账号" :disabled="isEditing" />
        </el-form-item>
        <el-form-item v-if="!isEditing" label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码（6-32位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="显示昵称（可选）" maxlength="32" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="邮箱（可选）" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="手机号（可选）" maxlength="11" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分配角色弹窗 -->
    <AssignRoleDialog
      v-model:visible="assignRoleVisible"
      :user-id="selectedUserId"
      @done="onAssignRoleDone"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser } from '@/api/user'
import type { ColumnConfig, SearchItemConfig } from '@/types/table'
import AssignRoleDialog from './AssignRoleDialog.vue'

defineOptions({ name: 'system-user' })

/** CrudTable 组件引用 —— 用于调用 reload 等暴露方法 */
const crudRef = ref()
/** 刷新表格 */
function reloadTable(): void {
  crudRef.value?.reload?.()
}

/** 表格列定义 */
const columns: ColumnConfig[] = [
  { prop: 'id', label: 'ID', width: 60 },
  { prop: 'username', label: '用户名', width: 120 },
  { prop: 'nickname', label: '昵称', width: 120 },
  { prop: 'email', label: '邮箱', width: 160 },
  { prop: 'roles', label: '角色', minWidth: 180 },
  { prop: 'status', label: '状态', width: 80 },
  { prop: 'createdAt', label: '创建时间', width: 170 },
]

/** 搜索项定义 */
const searchItems: SearchItemConfig[] = [
  { prop: 'keyword', label: '关键字', type: 'input', placeholder: '用户名 / 昵称' },
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

/** 表单模型 */
const form = reactive({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  status: 1,
  remark: '',
})

/** 表单校验规则 */
const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度 6-32 位', trigger: 'blur' },
  ],
}

/* ========== 状态切换 ========== */
/** 每个用户独立缓存 loading 状态，避免多个开关互相影响 */
const statusLoadingMap = reactive<Record<number, boolean>>({})

/**
 * 启用/禁用用户
 * @param user 用户行数据
 * @param val 新的开关值
 */
async function toggleStatus(user: { id: number; status: number }, val: boolean): Promise<void> {
  const newStatus = val ? 1 : 0
  statusLoadingMap[user.id] = true
  try {
    await updateUser(user.id, { status: newStatus })
    ElMessage.success(val ? '已启用' : '已禁用')
    reloadTable()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    statusLoadingMap[user.id] = false
  }
}

/* ========== 新增 / 编辑 ========== */
function openCreateDialog(): void {
  isEditing.value = false
  editingId.value = 0
  // 清空表单
  Object.assign(form, {
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
    status: 1,
    remark: '',
  })
  formVisible.value = true
}

function openEditDialog(row: {
  id: number
  username: string
  nickname: string
  email: string
  phone: string
  status: number
  remark: string
}): void {
  isEditing.value = true
  editingId.value = row.id
  // 编辑时密码留空（选填）
  Object.assign(form, {
    username: row.username,
    password: '',
    nickname: row.nickname || '',
    email: row.email || '',
    phone: row.phone || '',
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
      // 编辑：不传 password
      await updateUser(editingId.value, {
        nickname: form.nickname || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        status: form.status,
        remark: form.remark || undefined,
      })
      ElMessage.success('更新成功')
    } else {
      await createUser({
        username: form.username,
        password: form.password,
        nickname: form.nickname || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
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
    // 新建后恢复密码校验
    if (!isEditing.value) {
      form.password = ''
    }
  }
}

/* ========== 删除 ========== */
async function handleDelete(row: { id: number; username: string }): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认删除用户「${row.username}」？此操作不可恢复。`, '警告', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    reloadTable()
  } catch {
    // 取消操作或删除失败均静默
  }
}

/* ========== 分配角色 ========== */
const assignRoleVisible = ref(false)
const selectedUserId = ref(0)

function openAssignRoleDialog(row: { id: number }): void {
  selectedUserId.value = row.id
  assignRoleVisible.value = true
}

function onAssignRoleDone(): void {
  reloadTable()
}

/**
 * 时间格式化
 * @param t ISO 时间字符串
 * @returns 格式化的日期字符串
 */
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
