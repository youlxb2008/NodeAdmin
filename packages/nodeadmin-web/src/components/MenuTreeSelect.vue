<!--
  MenuTreeSelect - 父菜单选择器
  ----------------------------
  - 用 el-tree-select 从后端菜单树中选父菜单
  - 按钮类型（type === 'B'）的节点不允许作为父级，因此置为 disabled
  - 支持「根节点」作为第一个选项（id=0）
-->
<template>
  <el-tree-select
    :model-value="modelValue"
    :data="treeData"
    :props="treeProps as any"
    node-key="id"
    check-strictly
    :render-after-expand="false"
    placeholder="请选择父菜单（不选则为根节点）"
    clearable
    @update:model-value="onUpdate"
  />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ElTreeSelect } from 'element-plus'
import type { MenuTreeNode } from '@nodeadmin/shared'
import { getMenuTree } from '../api/menu'
import { useMenuStore } from '../store/menu'

void ElTreeSelect

/**
 * Props 定义
 */
interface Props {
  /** v-model 值（菜单父 ID；0 表示根节点） */
  modelValue?: number
  /** 需要排除的菜单 ID（编辑时排除自身，防止把自己设为父级） */
  excludeId?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  excludeId: 0,
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: number): void
}>()

const menuStore = useMenuStore()

// el-tree-select 的 :props 配置（label / value / children / disabled）
// 抽离为常量并用 any 透传，绕开 TreeOptionProps 不含 value 字段的类型声明问题
const treeProps = {
  label: 'name',
  value: 'id',
  children: 'children',
  disabled: isDisabled,
}

/**
 * 拼接「根节点」+ 后端菜单树作为下拉数据
 * 若 store 中已有菜单则复用，否则懒加载一次
 */
const treeData = computed<MenuTreeNode[]>(() => {
  // 这里手工构造一个伪根节点便于「选父菜单 = 根」
  const root: MenuTreeNode = {
    id: 0,
    parentId: -1,
    name: '根节点',
    path: '',
    component: '',
    icon: '',
    type: 'M',
    perm: '',
    sort: 0,
    hidden: false,
    status: 1,
    createdAt: '',
    updatedAt: '',
    children: pruneExclude(menuStore.menus, props.excludeId),
  }
  return [root]
})

/**
 * 在树中剔除排除的节点（含其子树）
 * @param nodes 原始节点列表
 * @param excludeId 要剔除的节点 ID（0 表示不剔除）
 */
function pruneExclude(nodes: MenuTreeNode[], excludeId: number): MenuTreeNode[] {
  if (!excludeId) return nodes
  return nodes
    .filter(n => n.id !== excludeId)
    .map(n => ({ ...n, children: pruneExclude(n.children || [], excludeId) }))
}

/**
 * 树节点是否禁用
 * - 按钮类型节点（type='B'）不能作父菜单
 * - 这里使用 any 接收，因为 el-tree-select 内部声明类型为 TreeNodeData，与业务节点结构兼容但 TS 不识别
 */
function isDisabled(data: any): boolean {
  return data?.type === 'B'
}

/** 转发选择 */
function onUpdate(value: unknown): void {
  // el-tree-select 允许清空 → null/undefined，统一转为 0（根节点）
  emit('update:modelValue', Number(value) || 0)
}

/**
 * 首次挂载：若菜单 store 为空，则主动拉取菜单树
 * 兜底逻辑，正常登录后已自动写入
 */
onMounted(async () => {
  if (menuStore.menus.length === 0) {
    try {
      const res = await getMenuTree()
      menuStore.setMenus(res.data?.data || [])
    } catch {
      // 静默失败：组件展示为空树，不影响其他功能
    }
  }
})
</script>
