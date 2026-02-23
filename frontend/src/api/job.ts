import request from '../utils/request';

/** 分页查询定时任务 */
export function getJobPage(params: Record<string, unknown>) {
  return request.get('/system/job/page', { params });
}

/** 新增定时任务 */
export function addJob(data: Record<string, unknown>) {
  return request.post('/system/job', data);
}

/** 修改定时任务 */
export function updateJob(data: Record<string, unknown>) {
  return request.put('/system/job', data);
}

/** 删除定时任务 */
export function deleteJob(id: number) {
  return request.delete(`/system/job/${id}`);
}

/** 批量删除定时任务 */
export function batchDeleteJobs(ids: number[]) {
  return request.delete('/system/job/batch', { data: ids });
}

/** 暂停任务 */
export function pauseJob(id: number) {
  return request.put(`/system/job/pause/${id}`);
}

/** 恢复任务 */
export function resumeJob(id: number) {
  return request.put(`/system/job/resume/${id}`);
}

/** 立即执行一次 */
export function runJob(id: number) {
  return request.post(`/system/job/run/${id}`);
}

/** 分页查询任务日志 */
export function getJobLogPage(params: Record<string, unknown>) {
  return request.get('/system/job-log/page', { params });
}

/** 删除任务日志 */
export function deleteJobLog(id: number) {
  return request.delete(`/system/job-log/${id}`);
}

/** 批量删除任务日志 */
export function batchDeleteJobLogs(ids: number[]) {
  return request.delete('/system/job-log/batch', { data: ids });
}

/** 清空任务日志 */
export function cleanJobLog() {
  return request.delete('/system/job-log/clean');
}
