import request from '../utils/request';
import { downloadFile } from '../utils/download';

// ========= 字典类型 =========

/** 分页查询字典类型 */
export function getDictTypePage(params: any) {
  return request.get('/system/dict/type/page', { params });
}

/** 查询所有字典类型（下拉用） */
export function getDictTypeList() {
  return request.get('/system/dict/type/list');
}

/** 查询字典类型详情 */
export function getDictTypeById(id: number) {
  return request.get(`/system/dict/type/${id}`);
}

/** 新增字典类型 */
export function createDictType(data: any) {
  return request.post('/system/dict/type', data);
}

/** 修改字典类型 */
export function updateDictType(data: any) {
  return request.put('/system/dict/type', data);
}

/** 删除字典类型 */
export function deleteDictType(id: number) {
  return request.delete(`/system/dict/type/${id}`);
}

/** 批量删除字典类型 */
export function batchDeleteDictTypes(ids: number[]) {
  return request.delete('/system/dict/type/batch', { data: ids });
}

/** 导出字典类型 */
export function exportDictTypes(params?: Record<string, unknown>) {
  return downloadFile('/system/dict/type/export', params);
}

// ========= 字典数据 =========

/** 分页查询字典数据 */
export function getDictDataPage(params: any) {
  return request.get('/system/dict/data/page', { params });
}

/** 根据字典类型查询数据（下拉用） */
export function getDictDataByType(dictType: string) {
  return request.get(`/system/dict/data/type/${dictType}`);
}

/** 查询字典数据详情 */
export function getDictDataById(id: number) {
  return request.get(`/system/dict/data/${id}`);
}

/** 新增字典数据 */
export function createDictData(data: any) {
  return request.post('/system/dict/data', data);
}

/** 修改字典数据 */
export function updateDictData(data: any) {
  return request.put('/system/dict/data', data);
}

/** 删除字典数据 */
export function deleteDictData(id: number) {
  return request.delete(`/system/dict/data/${id}`);
}
