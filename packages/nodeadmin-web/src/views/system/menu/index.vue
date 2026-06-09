<!--
  菜单管理
  --------
  树形表格展示（el-table + tree-props），支持编辑/删除/新增。
  数据来源：getMenuTree（嵌套结构）
  弹窗中通过 MenuTreeSelect 选父菜单、IconPicker 选图标。
-->
<template>
  <div>
    <el-card shadow="never" class="menu-table-card">
      <div class="menu-table-toolbar">
        <el-button v-permiss="'system:menu:create'" type="primary" @click="openCreateDialog">
          新增菜单
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="menuTree"
        row-key="id"
        :tree-props="{ children: 'children' }"
        :default-expand-all="false"
        :expand-row-keys="expandedIds"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="name" label="菜单名称" min-width="180" />
        <el-table-column prop="icon" label="图标" width="70" align="center">
          <template #default="{ row }">
            <Icon v-if="row.icon" :icon="row.icon" style="font-size: 18px" />
            <span v-else class="na-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'M' ? 'primary' : 'info'" size="small">
              {{ row.type === 'M' ? '菜单' : '按钮' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="perm" label="权限标识" min-width="150" />
        <el-table-column prop="path" label="路由路径" min-width="140" />
        <el-table-column prop="sort" label="排序" width="60" align="center" />
        <el-table-column prop="hidden" label="隐藏" width="60" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.hidden" size="small" type="warning">隐藏</el-tag>
            <span v-else class="na-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permiss="'system:menu:update'"
              text
              type="primary"
              size="small"
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              v-permiss="'system:menu:delete'"
              text
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="formVisible"
      :title="isEditing ? '编辑菜单' : '新增菜单'"
      width="560px"
      :close-on-click-modal="false"
      @closed="onFormClosed"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="父菜单">
          <MenuTreeSelect v-model="form.parentId" :exclude-id="isEditing ? editingId : 0" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" style="width: 120px">
            <el-option label="菜单" value="M" />
            <el-option label="按钮" value="B" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="菜单名称" maxlength="32" />
        </el-form-item>
        <el-form-item label="图标">
          <IconPicker v-model="form.icon" />
          <div v-if="form.icon" class="form-tip">
            预览：<Icon :icon="form.icon" style="font-size: 18px; vertical-align: middle" />
          </div>
        </el-form-item>
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="如 /system/user（菜单必填，按钮可选）" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="如 system/user/index（按钮类型留空）" />
        </el-form-item>
        <el-form-item label="权限标识">
          <el-input v-model="form.perm" placeholder="如 system:user:add" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="隐藏">
          <el-switch v-model="form.hidden" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Icon } from '@iconify/vue'
import { getMenuTree, createMenu, updateMenu, deleteMenu } from '@/api/menu'
import type { MenuTreeNode } from '@nodeadmin/shared'
import IconPicker from '@/components/IconPicker.vue'
import MenuTreeSelect from '@/components/MenuTreeSelect.vue'

defineOptions({ name: 'system-menu' })

/** 菜单树数据 */
const menuTree = ref<MenuTreeNode[]>([])
const loading = ref(false)

/** 默认展开到第 2 级的节点 ID 列表（expand-row-keys 要求 string[]） */
const expandedIds = ref<string[]>([])

/** 从树数据中收集前 maxLevel 级节点的 ID */
function collectExpandIds(tree: MenuTreeNode[], maxLevel: number): string[] {
  const ids: string[] = []
  function walk(nodes: MenuTreeNode[], level: number): void {
    for (const node of nodes) {
      if (level < maxLevel) {
        ids.push(String(node.id))
        if (node.children?.length) {
          walk(node.children, level + 1)
        }
      }
    }
  }
  walk(tree, 1)
  return ids
}

/** 加载菜单树 */
async function loadTree(): Promise<void> {
  loading.value = true
  try {
    const res = await getMenuTree()
    menuTree.value = res.data?.data || []
    // 默认展开到第 2 级
    expandedIds.value = collectExpandIds(menuTree.value, 2)
  } catch {
    ElMessage.error('加载菜单树失败')
  } finally {
    loading.value = false
  }
}

/* ========== 弹窗状态 ========== */
const formVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(0)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  parentId: 0,
  type: 'M' as 'M' | 'B',
  name: '',
  icon: '',
  path: '',
  component: '',
  perm: '',
  sort: 0,
  hidden: false,
  status: 1,
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
}

function openCreateDialog(): void {
  isEditing.value = false
  editingId.value = 0
  Object.assign(form, {
    parentId: 0,
    type: 'M',
    name: '',
    icon: '',
    path: '',
    component: '',
    perm: '',
    sort: 0,
    hidden: false,
    status: 1,
  })
  formVisible.value = true
}

function openEditDialog(row: MenuTreeNode): void {
  isEditing.value = true
  editingId.value = row.id
  Object.assign(form, {
    parentId: row.parentId === -1 ? 0 : row.parentId,
    type: row.type,
    name: row.name,
    icon: row.icon || '',
    path: row.path || '',
    component: row.component || '',
    perm: row.perm || '',
    sort: row.sort ?? 0,
    hidden: row.hidden ?? false,
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
      parentId: form.parentId,
      type: form.type,
      name: form.name,
      icon: form.icon || undefined,
      path: form.path || undefined,
      component: form.component || undefined,
      perm: form.perm || undefined,
      sort: form.sort,
      hidden: form.hidden,
      status: form.status,
    }
    if (isEditing.value) {
      await updateMenu(editingId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createMenu(payload)
      ElMessage.success('创建成功')
    }
    formVisible.value = false
    await loadTree()
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '操作失败'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}

/* ========== 删除 ========== */
async function handleDelete(row: MenuTreeNode): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认删除菜单「${row.name}」？`, '警告', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteMenu(row.id)
    ElMessage.success('删除成功')
    await loadTree()
  } catch {
    // 静默
  }
}

onMounted(() => {
  loadTree()
})
</script>

<style scoped>
.menu-table-card {
  border: 1px solid var(--na-border-lighter);
  border-radius: 6px;
}

.menu-table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.form-tip {
  font-size: 12px;
  color: var(--na-text-secondary);
  margin-top: 4px;
}
</style>
