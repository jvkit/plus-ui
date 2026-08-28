import request from '@/utils/request';
import { ReimbursementForm, ReimbursementQuery, ReimbursementVO } from './types';
import type { AxiosPromise } from '@/utils/api-types';

// 查询报销导出列表
export function listReimbursement(query: ReimbursementQuery): AxiosPromise<ReimbursementVO[]> {
  return request({
    url: '/procurement/reimbursement/list',
    method: 'get',
    params: query
  });
}

// 查询报销导出详细
export function getReimbursement(id: string | number): AxiosPromise<ReimbursementVO> {
  return request({
    url: '/procurement/reimbursement/' + id,
    method: 'get'
  });
}

// 生成报销包（后端自动生成报销编号 reim-...，并将相关材料打包为文件）
export function addReimbursement(data: ReimbursementForm) {
  return request({
    url: '/procurement/reimbursement',
    method: 'post',
    data: data
  });
}

// 下载报销包文件
export function downloadReimbursement(id: string | number) {
  return request({
    url: '/procurement/reimbursement/download/' + id,
    method: 'get',
    responseType: 'blob'
  });
}

// 导出报销导出列表
export function exportReimbursement(query: ReimbursementQuery) {
  return request({
    url: '/procurement/reimbursement/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  });
}

// 查询已验收完成的采购申请列表
export function acceptedRequestList(): AxiosPromise<any[]> {
  return request({
    url: '/procurement/request/acceptedList',
    method: 'get'
  });
}
