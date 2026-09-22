import request from '@/utils/request';
import type { AxiosPromise } from '@/utils/api-types';
import type { ProcurementInvoiceQuery, ProcurementInvoiceVO } from './types';

// 查询采购发票台账列表
export function listProcurementInvoice(query: ProcurementInvoiceQuery): AxiosPromise<{ rows: ProcurementInvoiceVO[]; total: number }> {
  return request({
    url: '/procurement/invoice/list',
    method: 'get',
    params: query
  });
}

// 查询采购发票台账详情
export function getProcurementInvoice(id: string | number): AxiosPromise<ProcurementInvoiceVO> {
  return request({
    url: '/procurement/invoice/' + id,
    method: 'get'
  });
}

// 删除采购发票台账
export function delProcurementInvoice(ids: string | number | Array<string | number>) {
  return request({
    url: '/procurement/invoice/' + ids,
    method: 'delete'
  });
}

// 手工上传发票并挂载到验收明细（不走 AI）
export function manualUploadInvoice(params: {
  acceptanceId?: string | number;
  requestId?: string | number;
  acceptanceItemId?: string | number;
  files: File[];
}) {
  const formData = new FormData();
  if (params.acceptanceId) formData.append('acceptanceId', String(params.acceptanceId));
  if (params.requestId) formData.append('requestId', String(params.requestId));
  if (params.acceptanceItemId) formData.append('acceptanceItemId', String(params.acceptanceItemId));
  params.files.forEach((file) => formData.append('files', file));
  return request({
    url: '/procurement/invoice/manual-upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000
  });
}
