import request from '../utils/request';
import { downloadFile } from '../utils/download';

/** 分页查询操作日志 */
export function getLogPage(params: any) {
  return request.get('/system/log/page', { params });
}

/** 删除日志 */
export function deleteLog(id: number) {
  return request.delete(`/system/log/${id}`);
}

/** 批量删除日志 */
export function batchDeleteLogs(ids: number[]) {
  return request.delete('/system/log/batch', { data: ids });
}

/** 清空日志 */
export function cleanLog() {
  return request.delete('/system/log/clean');
}

/** 导出操作日志 */
export function exportLogs(params?: Record<string, unknown>) {
  return downloadFile('/system/log/export', params);
}
