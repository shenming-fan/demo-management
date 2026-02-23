import request from '../utils/request';

/** 获取部门列表 */
export function getDeptList(params?: { name?: string; status?: number }) {
  return request.get('/system/dept/list', { params });
}

/** 获取部门树 */
export function getDeptTree() {
  return request.get('/system/dept/tree');
}

/** 获取部门详情 */
export function getDeptById(id: number) {
  return request.get(`/system/dept/${id}`);
}

/** 新增部门 */
export function createDept(data: Record<string, unknown>) {
  return request.post('/system/dept', data);
}

/** 修改部门 */
export function updateDept(data: Record<string, unknown>) {
  return request.put('/system/dept', data);
}

/** 删除部门 */
export function deleteDept(id: number) {
  return request.delete(`/system/dept/${id}`);
}
