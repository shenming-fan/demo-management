import request from '../utils/request';
import { downloadFile } from '../utils/download';

/** 分页查询登录日志 */
export function getLoginLogPage(params: { current?: number; size?: number; username?: string; status?: number }) {
  return request.get('/system/login-log/page', { params });
}

/** 删除登录日志 */
export function deleteLoginLog(id: number) {
  return request.delete(`/system/login-log/${id}`);
}

/** 批量删除登录日志 */
export function batchDeleteLoginLogs(ids: number[]) {
  return request.delete('/system/login-log/batch', { data: ids });
}

/** 清空登录日志 */
export function cleanLoginLog() {
  return request.delete('/system/login-log/clean');
}

/** 导出登录日志 */
export function exportLoginLogs(params?: Record<string, unknown>) {
  return downloadFile('/system/login-log/export', params);
}
