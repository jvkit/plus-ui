import request from '@/utils/request';
import type { AxiosPromise } from '@/utils/api-types';
import type { InvoiceWorkbenchQuery, InvoiceWorkbenchVO } from './types';

// 查询发票上传工作台列表（验收完成的采购申请 + 发票覆盖情况）
export function listInvoiceWorkbench(query: InvoiceWorkbenchQuery): AxiosPromise<{ rows: InvoiceWorkbenchVO[]; total: number }> {
  return request({
    url: '/procurement/invoiceWorkbench/list',
    method: 'get',
    params: query
  });
}

// 人工标记 / 取消标记发票上传完成
export function updateInvoiceWorkbenchDoneFlag(data: { requestId: string | number; done: boolean }) {
  return request({
    url: '/procurement/invoiceWorkbench/doneFlag',
    method: 'put',
    data: data
  });
}
