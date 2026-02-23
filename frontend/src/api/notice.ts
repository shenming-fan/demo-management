import request from '../utils/request';

/** 获取最新通知公告（铃铛用，含已读状态） */
export function getLatestNotices() {
  return request.get('/system/notice/latest');
}

/** 获取未读公告数量 */
export function getUnreadCount() {
  return request.get('/system/notice/unread-count');
}

/** 标记公告为已读 */
export function markNoticeRead(id: number) {
  return request.post(`/system/notice/${id}/read`);
}

/** 分页查询通知公告 */
export function getNoticePage(params: Record<string, unknown>) {
  return request.get('/system/notice/page', { params });
}

/** 获取公告详情 */
export function getNoticeById(id: number) {
  return request.get(`/system/notice/${id}`);
}

/** 新增通知公告 */
export function addNotice(data: Record<string, unknown>) {
  return request.post('/system/notice', data);
}

/** 修改通知公告 */
export function updateNotice(data: Record<string, unknown>) {
  return request.put('/system/notice', data);
}

/** 删除通知公告 */
export function deleteNotice(id: number) {
  return request.delete(`/system/notice/${id}`);
}

/** 批量删除通知公告 */
export function batchDeleteNotices(ids: number[]) {
  return request.delete('/system/notice/batch', { data: ids });
}
