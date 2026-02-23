import request from '../utils/request';

/** 上传文件 */
export function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/system/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** 分页查询文件 */
export function getFilePage(params: Record<string, unknown>) {
  return request.get('/system/file/page', { params });
}

/** 下载文件 */
export function downloadFile(id: number) {
  return request.get(`/system/file/download/${id}`, {
    responseType: 'blob',
  });
}

/** 删除文件 */
export function deleteFile(id: number) {
  return request.delete(`/system/file/${id}`);
}

/** 批量删除文件 */
export function deleteFileBatch(ids: number[]) {
  return request.delete('/system/file/batch', { data: ids });
}
