import request from '../utils/request';
import { downloadFile } from '../utils/download';

// 分页查询用户
export function getUserPage(params: {
  current?: number;
  size?: number;
  username?: string;
  phone?: string;
  status?: number;
}) {
  return request.get('/system/user/page', { params });
}

// 获取用户详情
export function getUserById(id: number) {
  return request.get(`/system/user/${id}`);
}

// 创建用户
export function createUser(data: any, roleIds?: number[], postIds?: number[]) {
  return request.post('/system/user', data, {
    params: { roleIds: roleIds?.join(','), postIds: postIds?.join(',') }
  });
}

// 更新用户
export function updateUser(data: any, roleIds?: number[], postIds?: number[]) {
  return request.put('/system/user', data, {
    params: { roleIds: roleIds?.join(','), postIds: postIds?.join(',') }
  });
}

// 删除用户
export function deleteUser(id: number) {
  return request.delete(`/system/user/${id}`);
}

// 批量删除用户
export function batchDeleteUsers(ids: number[]) {
  return request.delete('/system/user/batch', { data: ids });
}

// 批量修改状态
export function batchUpdateUserStatus(ids: number[], status: number) {
  return request.put('/system/user/batch/status', { ids, status });
}

// 重置密码
export function resetPassword(id: number, newPassword: string) {
  return request.put(`/system/user/${id}/password/reset`, null, {
    params: { newPassword }
  });
}

// 修改状态
export function updateUserStatus(id: number, status: number) {
  return request.put(`/system/user/${id}/status`, null, {
    params: { status }
  });
}

// 获取用户关联的角色ID列表
export function getUserRoles(id: number) {
  return request.get(`/system/user/${id}/roles`);
}

// 获取用户关联的岗位ID列表
export function getUserPosts(id: number) {
  return request.get(`/system/user/${id}/posts`);
}

// 导出用户列表
export function exportUsers(params?: Record<string, unknown>) {
  return downloadFile('/system/user/export', params);
}

// 下载用户导入模板
export function downloadImportTemplate() {
  return downloadFile('/system/user/import/template');
}

// 导入用户
export function importUsers(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/system/user/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}
