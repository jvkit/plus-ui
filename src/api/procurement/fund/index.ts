import request from '@/utils/request';
import { FundFlowQuery, FundFlowVO, FundManualForm, FundStatusBoardVO, FundStatusForm, FundSummaryVO, ManualFundStatus } from './types';
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

// 人工登记资金流水（自购=按 payers 拆账扣备用金；对公=一条直支流水）
export function addManualFundFlow(data: FundManualForm): AxiosPromise<FundFlowVO[]> {
  return request({
    url: '/procurement/fund/manual',
    method: 'post',
    data: data
  });
}

// 人工流水资金状态推进（仅 requestId 为空的自购人工流水可操作，单向不可回溯）
export function updateManualFundStatus(id: number | string, fundStatus: ManualFundStatus): AxiosPromise<void> {
  return request({
    url: `/procurement/fund/manual/${id}/fundStatus`,
    method: 'put',
    data: { fundStatus }
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
