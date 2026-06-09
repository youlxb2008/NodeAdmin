<!--
  AssignMenuDialog - 分配菜单弹窗
  -------------------------------
  el-dialog + el-tree（show-checkbox），加载全量菜单树，
  默认勾选角色已有菜单，树节点独立勾选，确认时只提交当前勾选节点。
-->
<template>
  <el-dialog
    :model-value="visible"
    title="分配菜单权限"
    width="500px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @open="onOpen"
  >
    <!-- 加载中 -->
    <div v-if="loading" style="text-align: center; padding: 40px 0">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <p style="color: var(--na-text-secondary); margin-top: 8px">加载菜单树...</p>
    </div>

    <!-- 菜单树 -->
    <el-tree
      v-show="!loading"
      ref="treeRef"
      :data="menuTree"
      node-key="id"
      show-checkbox
      check-strictly
      default-expand-all
      :props="{ label: 'name', children: 'children' }"
      class="menu-tree"
    />

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import type { MenuTreeNode } from '@nodeadmin/shared'
import { getMenuTree } from '@/api/menu'
import { getRoleById, assignRoleMenus } from '@/api/role'
import type { RoleWithMenus } from '@nodeadmin/shared'

/**
 * Props 定义
 */
interface Props {
  visible: boolean
  roleId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'done'): void
}>()

const treeRef = ref()
const menuTree = ref<MenuTreeNode[]>([])
const checkedMenuIds = ref<number[]>([])
const loading = ref(false)
const submitting = ref(false)

/**
 * 弹窗打开时：
 * 1. 拉取全量菜单树
 * 2. 拉取角色详情（含已分配菜单 IDs）
 */
async function onOpen(): Promise<void> {
  if (!props.roleId) return
  loading.value = true
  try {
    const [treeRes, roleRes] = await Promise.all([getMenuTree(), getRoleById(props.roleId)])
    menuTree.value = treeRes.data?.data || []
    const role = roleRes.data as RoleWithMenus
    // 角色详情接口直接返回角色对象，menus 为已分配菜单对象数组
    checkedMenuIds.value = (role.menus || []).map(m => m.id)
  } catch {
    ElMessage.error('加载菜单数据失败')
  } finally {
    loading.value = false
  }
  // el-tree 的 default-checked-keys 仅初始化时生效，弹窗复用时需要主动同步勾选状态
  await nextTick()
  treeRef.value?.setCheckedKeys(checkedMenuIds.value, false)
}

/**
 * 提交菜单分配
 * 树节点启用 check-strictly 后，父子节点互不联动，直接提交当前勾选节点即可。
 */
async function handleSubmit(): Promise<void> {
  if (!treeRef.value) return
  submitting.value = true
  try {
    const menuIds = treeRef.value.getCheckedKeys(false) as number[]
    await assignRoleMenus(props.roleId, { id: props.roleId, menuIds })
    ElMessage.success('菜单分配成功')
    emit('update:visible', false)
    emit('done')
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '分配失败'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.menu-tree {
  max-height: 420px;
  overflow-y: auto;
  padding: 8px 0;
}
</style>
