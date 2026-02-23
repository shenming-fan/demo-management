import request from '../utils/request';

/** 分页查询已导入的表 */
export function getGenTablePage(params: any) {
  return request.get('/tool/gen/page', { params });
}

/** 查询可导入的数据库表 */
export function getDbTableList(params?: { tableName?: string }) {
  return request.get('/tool/gen/db/list', { params });
}

/** 导入表 */
export function importTables(tableNames: string[]) {
  return request.post('/tool/gen/import', tableNames);
}

/** 查询表详情（含列配置） */
export function getGenTableById(id: number) {
  return request.get(`/tool/gen/${id}`);
}

/** 更新表及列配置 */
export function updateGenTable(data: any) {
  return request.put('/tool/gen', data);
}

/** 删除已导入的表 */
export function deleteGenTable(id: number) {
  return request.delete(`/tool/gen/${id}`);
}

/** 预览代码 */
export function previewCode(id: number) {
  return request.get(`/tool/gen/preview/${id}`);
}

/** 下载代码 */
export function downloadCode(id: number) {
  return request.get(`/tool/gen/download/${id}`, { responseType: 'blob' });
}
