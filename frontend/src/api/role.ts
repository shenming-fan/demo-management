import request from '../utils/request';
import { downloadFile } from '../utils/download';

// 分页查询角色
export function getRolePage(params: {
  current?: number;
  size?: number;
  name?: string;
  status?: number;
}) {
  return request.get('/system/role/page', { params });
}

// 获取所有启用的角色
export function getRoleList() {
  return request.get('/system/role/list');
}

// 获取角色详情
export function getRoleById(id: number) {
  return request.get(`/system/role/${id}`);
}

// 获取角色的菜单ID列表
export function getRoleMenus(id: number) {
  return request.get(`/system/role/${id}/menus`);
}

// 创建角色
export function createRole(data: any, menuIds?: number[]) {
  return request.post('/system/role', data, {
    params: { menuIds: menuIds?.join(',') }
  });
}

// 更新角色
export function updateRole(data: any, menuIds?: number[]) {
  return request.put('/system/role', data, {
    params: { menuIds: menuIds?.join(',') }
  });
}

// 删除角色
export function deleteRole(id: number) {
  return request.delete(`/system/role/${id}`);
}

// 批量删除角色
export function batchDeleteRoles(ids: number[]) {
  return request.delete('/system/role/batch', { data: ids });
}

// 导出角色列表
export function exportRoles(params?: Record<string, unknown>) {
  return downloadFile('/system/role/export', params);
}
