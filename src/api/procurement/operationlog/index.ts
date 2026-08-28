import request from '@/utils/request';
import { OperationLogQuery, OperationLogVO } from './types';
import type { AxiosPromise } from '@/utils/api-types';

// 查询流转记录列表
export function listOperationLog(query: OperationLogQuery): AxiosPromise<OperationLogVO[]> {
  return request({
    url: '/procurement/log/list',
    method: 'get',
    params: query
  });
}
