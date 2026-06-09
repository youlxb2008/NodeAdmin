<!--
  PageHeader 通用页头组件
  - 左侧显示页面标题
  - 右侧 actions 插槽用于放置操作按钮
-->
<template>
  <div class="page-header">
    <div class="page-header-title">{{ title }}</div>
    <div class="page-header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * PageHeader Props
 */
interface Props {
  /** 页面标题文案 */
  title: string
}

defineProps<Props>()
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  margin-bottom: 12px;
  background: var(--na-bg-container);
  border: 1px solid var(--na-border-lighter);
  border-radius: 6px;
}

.page-header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--na-text-primary);
}

.page-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
