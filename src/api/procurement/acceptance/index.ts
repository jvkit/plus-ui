import request from '@/utils/request';
import { AcceptanceForm, AcceptanceQuery, AcceptanceVO } from './types';
import type { AxiosPromise } from '@/utils/api-types';

// 查询采购验收列表
export function listAcceptance(query: AcceptanceQuery): AxiosPromise<AcceptanceVO[]> {
  return request({
    url: '/procurement/acceptance/list',
    method: 'get',
    params: query
  });
}

// 查询采购验收详细
export function getAcceptance(id: string | number): AxiosPromise<AcceptanceVO> {
  return request({
    url: '/procurement/acceptance/' + id,
    method: 'get'
  });
}

// 新增采购验收
export function addAcceptance(data: AcceptanceForm) {
  return request({
    url: '/procurement/acceptance',
    method: 'post',
    data: data
  });
}

// 提交验收并启动流程（验收发起人→采购申请人→项目负责人→团队上级）
export function submitAcceptance(data: AcceptanceForm) {
  return request({
    url: '/procurement/acceptance/submit',
    method: 'post',
    data: data
  });
}

// 修改采购验收
export function updateAcceptance(data: AcceptanceForm) {
  return request({
    url: '/procurement/acceptance',
    method: 'put',
    data: data
  });
}

// 删除采购验收
export function delAcceptance(id: string | number | Array<string | number>) {
  return request({
    url: '/procurement/acceptance/' + id,
    method: 'delete'
  });
}

// 导出采购验收
export function exportAcceptance(query: AcceptanceQuery) {
  return request({
    url: '/procurement/acceptance/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  });
}

// 查询可验收的采购申请（已审批通过且尚未创建验收单）
export function acceptableRequestList(): AxiosPromise<any[]> {
  return request({
    url: '/procurement/request/acceptableList',
    method: 'get'
  });
}

// 发票批量识别 + 匹配 + 持久化（调用 agents 智能体服务）
// acceptanceId: 验收单 ID（编辑草稿时传入，新增可为空）
// items: 验收明细数组（itemName/spec/applyPrice/quantity/id），files: 发票 PDF 数组
export function aiInvoiceMatch(items: any[], files: File[], acceptanceId?: string | number): AxiosPromise<any> {
  const formData = new FormData();
  if (acceptanceId !== undefined && acceptanceId !== null && acceptanceId !== '') {
    formData.append('acceptanceId', String(acceptanceId));
  }
  formData.append('items', JSON.stringify(items));
  files.forEach((f) => formData.append('files', f));
  return request({
    url: '/procurement/acceptance/ai-invoice-match',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000
  });
}
