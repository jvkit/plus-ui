import request from '@/utils/request';
import type { AxiosPromise } from '@/utils/api-types';

export interface FundSourceVO {
  id: number | string;
  parentId: number | string;
  name: string;
  sort?: number;
  status?: number;
  remark?: string;
  children?: FundSourceVO[];
}

// 查询项目归属(资金来源)树
export function fundSourceTree(): AxiosPromise<FundSourceVO[]> {
  return request({
    url: '/procurement/fundSource/tree',
    method: 'get'
  });
}
