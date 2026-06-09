<!--
  根组件 App
  - el-config-provider 注入 zh-cn 语言包
  - 全局只有一个 router-view，所有布局逻辑下沉到 layout/index.vue
-->
<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
</script>
