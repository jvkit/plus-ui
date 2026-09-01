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
