import request from '../utils/request';

/** 分页查询${functionName} */
export function get${className}Page(params: any) {
  return request.get('/${moduleName}/${businessName}/page', { params });
}

/** 查询${functionName}详情 */
export function get${className}ById(id: number) {
  return request.get(`/${moduleName}/${businessName}/${'$'}{id}`);
}

/** 新增${functionName} */
export function create${className}(data: any) {
  return request.post('/${moduleName}/${businessName}', data);
}

/** 修改${functionName} */
export function update${className}(data: any) {
  return request.put('/${moduleName}/${businessName}', data);
}

/** 删除${functionName} */
export function delete${className}(id: number) {
  return request.delete(`/${moduleName}/${businessName}/${'$'}{id}`);
}
