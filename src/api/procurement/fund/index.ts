import request from '@/utils/request';
import { FundFlowQuery, FundFlowVO, FundStatusBoardVO, FundStatusForm, FundSummaryVO } from './types';
import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';

// 查询资金流水分页列表
export function listFundFlow(query: FundFlowQuery): AxiosPromise<PageResult<FundFlowVO>> {
  return request({
    url: '/procurement/fund/list',
    method: 'get',
    params: query
  });
}

// 资金汇总（总预算/已用/剩余 + 本月流出 + 按项目维度 + 备用金 reserve 子对象）
export function getFundSummary(projectId?: number | string): AxiosPromise<FundSummaryVO> {
  return request({
    url: '/procurement/fund/summary',
    method: 'get',
    params: { projectId }
  });
}

// 资金状态看板（4 个状态的笔数 + 金额合计）
export function getFundStatusBoard(): AxiosPromise<FundStatusBoardVO[]> {
  return request({
    url: '/procurement/fund/status/board',
    method: 'get'
  });
}

// 批量变更资金状态（reimburse=标记已报销 / paid=确认已汇款），msg 里带成功/跳过明细
export function updateFundStatus(data: FundStatusForm): AxiosPromise<void> {
  return request({
    url: '/procurement/fund/status',
    method: 'put',
    data: data
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
