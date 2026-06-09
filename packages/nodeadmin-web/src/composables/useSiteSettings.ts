/**
 * 站点配置 Composable
 *
 * 提供加载公开配置的能力，在 main.ts bootstrap 和路由守卫中使用。
 * 加载失败时静默处理，使用 store 中的默认值。
 */
import { useSiteStore } from '../store/site'
import { getPublicSite } from '../api/site'

/**
 * 从公开接口加载站点配置并写入 store
 * 失败时静默处理（使用默认值），不影响应用启动
 */
export async function loadPublicSite(): Promise<void> {
  try {
    const res = await getPublicSite()
    // 解析响应数据：res.data 是 AxiosResponse.data，即 ApiResponse<T>
    const data = res.data?.data
    if (data) {
      const store = useSiteStore()
      store.setSite(data)
    }
  } catch {
    // 加载失败使用默认配置，不影响页面正常访问
  }
}
