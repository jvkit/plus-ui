import request from '@/utils/request';
import { BomNodeForm, BomNodeVO, BomTableForm, BomTableQuery, BomTableVO } from './types';
import type { AxiosPromise } from '@/utils/api-types';

// 查询BOM产品列表
export function listBomTable(query: BomTableQuery): AxiosPromise<BomTableVO[]> {
  return request({
    url: '/procurement/bomtable/list',
    method: 'get',
    params: query
  });
}

// 查询BOM产品详细
export function getBomTable(id: string | number): AxiosPromise<BomTableVO> {
  return request({
    url: '/procurement/bomtable/' + id,
    method: 'get'
  });
}

// 新增BOM产品
export function addBomTable(data: BomTableForm) {
  return request({
    url: '/procurement/bomtable',
    method: 'post',
    data: data
  });
}

// 修改BOM产品
export function updateBomTable(data: BomTableForm) {
  return request({
    url: '/procurement/bomtable',
    method: 'put',
    data: data
  });
}

// 删除BOM产品
export function delBomTable(id: string | number | Array<string | number>) {
  return request({
    url: '/procurement/bomtable/' + id,
    method: 'delete'
  });
}

// 导出BOM产品
export function exportBomTable(query: BomTableQuery) {
  return request({
    url: '/procurement/bomtable/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  });
}

// 查询BOM节点列表（按BOM表，后端返回平铺列表，前端组树）
export function listBomNode(bomTableId: string | number): AxiosPromise<BomNodeVO[]> {
  return request({
    url: '/procurement/bomtable/node/list/' + bomTableId,
    method: 'get'
  });
}

// 新增BOM节点
export function addBomNode(data: BomNodeForm) {
  return request({
    url: '/procurement/bomtable/node',
    method: 'post',
    data: data
  });
}

// 修改BOM节点
export function updateBomNode(data: BomNodeForm) {
  return request({
    url: '/procurement/bomtable/node',
    method: 'put',
    data: data
  });
}

// 删除BOM节点
export function delBomNode(id: string | number | Array<string | number>) {
  return request({
    url: '/procurement/bomtable/node/' + id,
    method: 'delete'
  });
}
