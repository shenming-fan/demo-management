import request from '../utils/request';
import { downloadFile } from '../utils/download';

/** 分页查询岗位 */
export function getPostPage(params: any) {
  return request.get('/system/post/list', { params });
}

/** 获取岗位详情 */
export function getPostById(id: number) {
  return request.get(`/system/post/${id}`);
}

/** 获取全部岗位（下拉选择用） */
export function getPostAll() {
  return request.get('/system/post/all');
}

/** 新增岗位 */
export function createPost(data: any) {
  return request.post('/system/post', data);
}

/** 修改岗位 */
export function updatePost(data: any) {
  return request.put('/system/post', data);
}

/** 删除岗位 */
export function deletePost(id: number) {
  return request.delete(`/system/post/${id}`);
}

/** 批量删除岗位 */
export function batchDeletePosts(ids: number[]) {
  return request.delete('/system/post/batch', { data: ids });
}

/** 批量更新排序 */
export function updatePostSort(sortList: { id: number; sort: number }[]) {
  return request.put('/system/post/sort', sortList);
}

/** 导出岗位列表 */
export function exportPosts(params?: Record<string, unknown>) {
  return downloadFile('/system/post/export', params);
}
