import request from '../utils/request';

/** 获取在线用户列表 */
export function getOnlineList(params?: { username?: string }) {
  return request.get('/system/online/list', { params });
}

/** 强制下线 */
export function forceLogout(tokenKey: string) {
  return request.delete(`/system/online/${tokenKey}`);
}
