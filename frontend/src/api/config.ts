import request from '../utils/request';

/** 分页查询参数配置 */
export function getConfigPage(params: any) {
  return request.get('/system/config/list', { params });
}

/** 获取参数配置详情 */
export function getConfigById(id: number) {
  return request.get(`/system/config/${id}`);
}

/** 根据key获取参数值 */
export function getConfigByKey(configKey: string) {
  return request.get(`/system/config/key/${configKey}`);
}

/** 新增参数配置 */
export function createConfig(data: any) {
  return request.post('/system/config', data);
}

/** 修改参数配置 */
export function updateConfig(data: any) {
  return request.put('/system/config', data);
}

/** 删除参数配置 */
export function deleteConfig(id: number) {
  return request.delete(`/system/config/${id}`);
}

/** 批量删除参数配置 */
export function batchDeleteConfigs(ids: number[]) {
  return request.delete('/system/config/batch', { data: ids });
}

/** 刷新参数缓存 */
export function refreshConfigCache() {
  return request.post('/system/config/refreshCache');
}

/** 根据key更新参数值 */
export function updateConfigByKey(configKey: string, configValue: string) {
  return request.put('/system/config/updateByKey', { configKey, configValue });
}
