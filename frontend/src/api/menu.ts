import request from '../utils/request';

// 获取菜单列表
export function getMenuList(params?: { name?: string; status?: number }) {
  return request.get('/system/menu/list', { params });
}

// 获取菜单树
export function getMenuTree() {
  return request.get('/system/menu/tree');
}

// 获取菜单详情
export function getMenuById(id: number) {
  return request.get(`/system/menu/${id}`);
}

// 创建菜单
export function createMenu(data: any) {
  return request.post('/system/menu', data);
}

// 更新菜单
export function updateMenu(data: any) {
  return request.put('/system/menu', data);
}

// 删除菜单
export function deleteMenu(id: number) {
  return request.delete(`/system/menu/${id}`);
}

// 批量更新排序
export function updateMenuSort(sortList: { id: number; sort: number }[]) {
  return request.put('/system/menu/sort', sortList);
}
