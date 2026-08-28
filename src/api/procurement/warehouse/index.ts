import request from '@/utils/request';
import { WarehouseForm, WarehouseQuery, WarehouseVO } from './types';
import type { AxiosPromise } from '@/utils/api-types';

// 查询仓库库存列表
export function listWarehouse(query: WarehouseQuery): AxiosPromise<WarehouseVO[]> {
  return request({
    url: '/procurement/warehouse/list',
    method: 'get',
    params: query
  });
}

// 查询仓库库存详细
export function getWarehouse(id: string | number): AxiosPromise<WarehouseVO> {
  return request({
    url: '/procurement/warehouse/' + id,
    method: 'get'
  });
}

// 手动入库
export function addWarehouse(data: WarehouseForm) {
  return request({
    url: '/procurement/warehouse',
    method: 'post',
    data: data
  });
}

// 修改仓库库存
export function updateWarehouse(data: WarehouseForm) {
  return request({
    url: '/procurement/warehouse',
    method: 'put',
    data: data
  });
}

// 删除仓库库存
export function delWarehouse(id: string | number | Array<string | number>) {
  return request({
    url: '/procurement/warehouse/' + id,
    method: 'delete'
  });
}

// 导出仓库库存
export function exportWarehouse(query: WarehouseQuery) {
  return request({
    url: '/procurement/warehouse/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  });
}
