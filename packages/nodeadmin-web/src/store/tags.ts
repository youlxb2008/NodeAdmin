import { defineStore } from 'pinia'

/** 标签项数据结构 */
interface TagItem {
  /** 路由 name，作为 keep-alive include 依据 */
  name: string
  /** 路由 fullPath，唯一标识 */
  path: string
  /** 标签显示文案 */
  title: string
}

/**
 * 标签页 Store
 *
 * 管理顶部标签栏：打开、关闭、关闭其他、清空。
 */
export const useTagsStore = defineStore('tags', {
  state: () => ({
    /** 当前打开的标签列表 */
    list: [] as TagItem[],
  }),
  getters: {
    /** 是否显示标签栏（有标签时显示） */
    show: state => state.list.length > 0,
    /** 标签名称列表，供 keep-alive include 使用 */
    nameList: state => state.list.map(item => item.name),
  },
  actions: {
    /** 删除指定索引的标签 */
    delTagsItem(index: number) {
      this.list.splice(index, 1)
    },
    /** 追加一个新标签 */
    setTagsItem(data: TagItem) {
      this.list.push(data)
    },
    /** 清空所有标签 */
    clearTags() {
      this.list = []
    },
    /** 关闭其他标签，仅保留指定标签 */
    closeTagsOther(data: TagItem[]) {
      this.list = data
    },
  },
})
