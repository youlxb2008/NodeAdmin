import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'

/**
 * Axios 实例
 *
 * 基本配置：
 * - baseURL 来自 VITE_API_BASE_URL 环境变量
 * - withCredentials: true：自动携带 HttpOnly Cookie（鉴权依赖此项）
 * - 前端不维护 token，所有鉴权由浏览器 Cookie 透传
 */
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  withCredentials: true,
})

/**
 * 响应拦截器
 * 401 时跳转登录页（登录页自身除外，避免死循环）
 */
service.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // 401：会话失效 → 重定向到登录页
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      window.location.href = '/admin/login'
      return Promise.reject(error)
    }
    console.error('响应拦截器错误:', error)
    return Promise.reject(error)
  },
)

export default service
