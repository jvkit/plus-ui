import request from '@/utils/request';
import { FundFlowQuery, FundFlowVO, FundSummaryVO } from './types';
import type { AxiosPromise } from '@/utils/api-types';

// 查询资金流水分页列表
export function listFundFlow(query: FundFlowQuery): AxiosPromise<FundFlowVO[]> {
  return request({
    url: '/procurement/fund/list',
    method: 'get',
    params: query
  });
}

// 资金汇总（总预算/已用/剩余 + 本月流出 + 按项目维度）
export function getFundSummary(projectId?: number | string): AxiosPromise<FundSummaryVO> {
  return request({
    url: '/procurement/fund/summary',
    method: 'get',
    params: { projectId }
  });
}

// 导出资金流水
export function exportFundFlow(query: FundFlowQuery) {
  return request({
    url: '/procurement/fund/export',
    method: 'post',
    params: query,
    responseType: 'blob'
  });
}
