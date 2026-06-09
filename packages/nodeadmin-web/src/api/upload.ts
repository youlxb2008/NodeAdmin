import request from './request'

/**
 * 上传图片文件
 * @param file 图片文件对象
 * @returns 上传成功后返回的图片访问 URL
 */
export const uploadImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<{ code: number; data: { url: string } }>('/api/admin/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}
