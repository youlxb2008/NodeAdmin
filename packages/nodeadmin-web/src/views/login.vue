<!--
  登录页
  - 风格借鉴 vue-manage-system 的简单卡片版本
  - 视觉：渐变背景 + 阴影卡片，支持暗色友好
  - 登录成功后写入 user/perms/menus，并注册动态路由
-->
<template>
  <div class="login-wrap" :style="loginBgStyle">
    <div class="login-card">
      <div class="login-header">
        <h2 class="login-title">{{ loginTitle }}</h2>
        <p class="login-subtitle">管理后台 · 请登录您的账号</p>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="0"
        class="login-form"
        @keyup.enter="submit"
      >
        <el-form-item prop="username">
          <el-input
            v-model="formData.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="submit">
          登 录
        </el-button>
      </el-form>
    </div>

    <div class="login-footer">{{ loginTitle }} &copy; {{ year }}</div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { login } from '../api/auth'
import { useUserStore } from '../store/user'
import { usePermissStore } from '../store/permiss'
import { useMenuStore } from '../store/menu'
import { useTagsStore } from '../store/tags'
import { useSiteStore } from '../store/site'
import router0, { setAuthenticated, registerDynamicRoutes } from '../router'

const router = useRouter()
const userStore = useUserStore()
const permissStore = usePermissStore()
const menuStore = useMenuStore()
const tagsStore = useTagsStore()
const siteStore = useSiteStore()

/** 动态平台标题（从站点配置 store 获取，默认 NodeAdmin） */
const loginTitle = computed(() => siteStore.title || 'NodeAdmin')

/** 动态背景图样式（有背景图时覆盖默认渐变） */
const loginBgStyle = computed(() => {
  if (!siteStore.loginBg) return {}
  const bg = siteStore.loginBg
  // 预设图以 /admin/ 开头，直接使用；上传图需要拼接 API base URL
  const bgUrl =
    bg.startsWith('/admin/') || bg.startsWith('http')
      ? bg
      : `${import.meta.env.VITE_API_BASE_URL || ''}${bg}`
  return {
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})

/** 当前年份（用于页脚） */
const year = new Date().getFullYear()

/** 加载状态 */
const loading = ref(false)
/** 表单引用 */
const formRef = ref<FormInstance>()

/** 登录表单数据 */
const formData = reactive({
  username: '',
  password: '',
})

/** 表单校验规则 */
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// 进入登录页时清空标签，避免登录后混乱
onMounted(() => {
  tagsStore.clearTags()
})

/**
 * 提交登录
 * 1. 表单校验
 * 2. 调用后端 /api/auth/login
 * 3. 写入 user/perms/menus
 * 4. 注册动态路由 + 设置已认证标记
 * 5. 跳转首页
 */
async function submit(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await login(formData)
    const data = res.data?.data
    if (!data) {
      ElMessage.error('登录响应数据异常')
      return
    }
    // 写入全局状态
    userStore.setUser(data.user)
    permissStore.setPerms(data.perms || [])
    menuStore.setMenus(data.menus || [])
    // 注册动态路由后再放行守卫
    registerDynamicRoutes(router0, data.menus || [])
    setAuthenticated(true)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '登录失败'
    ElMessage.error(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 渐变背景：暗色友好的深蓝紫调 */
  background: linear-gradient(135deg, #1e3a8a 0%, #6366f1 50%, #8b5cf6 100%);
}

.login-card {
  width: 380px;
  padding: 36px 32px;
  background: var(--na-bg-container);
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--na-text-primary);
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.login-subtitle {
  font-size: 13px;
  color: var(--na-text-secondary);
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  padding: 4px 12px;
}

.login-form :deep(.el-input__inner) {
  height: 42px;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  margin-top: 8px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border: none;
}

.login-btn:hover {
  background: linear-gradient(135deg, #2563eb, #4f46e5);
}

.login-footer {
  position: absolute;
  bottom: 20px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
</style>
