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

// 新增报销记录（建立申请-报销关联，生成报销编号）
export function addReimbursement(data: ReimbursementForm) {
  return request({
    url: '/procurement/reimbursement',
    method: 'post',
    data: data
  });
}

// 生成报销包（后端打包 Excel + 验收图片 + 发票 PDF 为 zip，上传 MinIO 并回写）
export function generateReimbursement(id: string | number) {
  return request({
    url: '/procurement/reimbursement/generate/' + id,
    method: 'post'
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

// 查询已完成验收的采购申请列表（报销打包数据源）
export function reimbursableRequestList(): AxiosPromise<any[]> {
  return request({
    url: '/procurement/request/reimbursableList',
    method: 'get'
  });
}
