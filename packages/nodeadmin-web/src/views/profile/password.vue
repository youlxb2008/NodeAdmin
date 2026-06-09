<!--
  修改密码
  ----------
  基本校验：
    - 旧密码必填
    - 新密码 8+ 位 且 不能与旧密码相同
    - 确认密码与新密码一致
  成功后：ElMessage.success → 清除登录态 → 跳转 /login
-->
<template>
  <div>
    <PageHeader title="修改密码" />

    <el-card shadow="never" class="password-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        style="max-width: 500px"
      >
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input
            v-model="form.oldPassword"
            type="password"
            placeholder="请输入旧密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="新密码 ≥ 8 位"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            修改密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { changePassword } from '../../api/auth'
import { useUserStore } from '../../store/user'
import { usePermissStore } from '../../store/permiss'
import { useMenuStore } from '../../store/menu'
import { setAuthenticated, resetDynamicRoutes } from '../../router'

defineOptions({ name: 'profile-password' })

const router = useRouter()
const userStore = useUserStore()
const permissStore = usePermissStore()
const menuStore = useMenuStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)

/** 表单模型 */
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

/**
 * 表单校验规则
 * - newPassword 校验：8 位以上，且不能与 oldPassword 相同
 * - confirmPassword 校验：与 newPassword 一致
 */
const rules: FormRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '新密码至少 8 位', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        // 与旧密码相同时拒绝（避免无效修改）
        if (value && value === form.oldPassword) {
          callback(new Error('新密码不能与旧密码相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

/**
 * 提交修改密码
 * 成功后清空 store 与动态路由标记，跳转登录页要求重新登录
 */
async function handleSubmit(): Promise<void> {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await changePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    })
    ElMessage.success('密码修改成功，请重新登录')
    // 清空全局会话状态
    userStore.clearUser()
    permissStore.clearPerms()
    menuStore.clearMenus()
    setAuthenticated(false)
    resetDynamicRoutes()
    router.push('/login')
  } catch (err: unknown) {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '修改失败'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.password-card {
  border: 1px solid var(--na-border-lighter);
  border-radius: 6px;
  padding: 8px;
}
</style>
