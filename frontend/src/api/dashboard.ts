import request from '../utils/request';

// 获取仪表盘统计数据
export function getDashboardStats() {
  return request.get('/dashboard/stats');
}

// 获取大屏统计数据
export function getBigscreenData() {
  return request.get('/dashboard/bigscreen');
}
