import request from '../utils/request';

/** 获取Redis信息 */
export function getCacheInfo() {
  return request.get('/system/cache/info');
}

/** 获取缓存key列表 */
export function getCacheKeys(prefix?: string) {
  return request.get('/system/cache/keys', { params: { prefix } });
}

/** 获取缓存key的值 */
export function getCacheValue(key: string) {
  return request.get(`/system/cache/value/${key}`);
}

/** 删除指定缓存key */
export function deleteCacheKey(key: string) {
  return request.delete(`/system/cache/${key}`);
}

/** 清空指定前缀的缓存 */
export function clearCacheByPrefix(prefix: string) {
  return request.delete('/system/cache/clear', { params: { prefix } });
}
