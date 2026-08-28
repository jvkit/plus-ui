import request from '@/utils/request';
import { ContractForm, ContractQuery, ContractVO } from './types';
import type { AxiosPromise } from '@/utils/api-types';

// 查询采购合同列表
export function listContract(query: ContractQuery): AxiosPromise<ContractVO[]> {
  return request({
    url: '/procurement/contract/list',
    method: 'get',
    params: query
  });
}

// 查询采购合同详细
export function getContract(id: string | number): AxiosPromise<ContractVO> {
  return request({
    url: '/procurement/contract/' + id,
    method: 'get'
  });
}

// 生成采购合同（后端自动生成合同编号 ctrt-...，按模板渲染内容并生成合同文件）
export function addContract(data: ContractForm) {
  return request({
    url: '/procurement/contract',
    method: 'post',
    data: data
  });
}

// 导出采购合同
export function exportContract(query: ContractQuery) {
  return request({
    url: '/procurement/contract/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  });
}

// 查询可生成合同的"对公"采购申请列表
export function companyRequestList(): AxiosPromise<any[]> {
  return request({
    url: '/procurement/request/companyList',
    method: 'get'
  });
}
