import request from '@/utils/request';
import { CatalogForm, CatalogQuery, CatalogVO } from './types';
import type { AxiosPromise } from '@/utils/api-types';

// 查询BOM物料库列表
export function listCatalog(query: CatalogQuery): AxiosPromise<CatalogVO[]> {
  return request({
    url: '/procurement/catalog/list',
    method: 'get',
    params: query
  });
}

// 查询BOM物料库详细
export function getCatalog(id: string | number): AxiosPromise<CatalogVO> {
  return request({
    url: '/procurement/catalog/' + id,
    method: 'get'
  });
}

// 新增BOM物料
export function addCatalog(data: CatalogForm) {
  return request({
    url: '/procurement/catalog',
    method: 'post',
    data: data
  });
}

// 修改BOM物料
export function updateCatalog(data: CatalogForm) {
  return request({
    url: '/procurement/catalog',
    method: 'put',
    data: data
  });
}

// 删除BOM物料
export function delCatalog(id: string | number | Array<string | number>) {
  return request({
    url: '/procurement/catalog/' + id,
    method: 'delete'
  });
}

// 导出BOM物料库
export function exportCatalog(query: CatalogQuery) {
  return request({
    url: '/procurement/catalog/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  });
}
