// 资金流水类型定义
import type { ReservePerson, ReserveSummaryVO } from '@/api/procurement/reserve/types';

export interface FundFlowVO {
  id: number | string;
  flowNo: string; // 流水编号
  flowType: string; // 类型 out=流出 in=流入
  projectId: number | string;
  projectName: string; // 项目名快照
  requestId: number | string;
  requestCode: string; // 申请编号快照
  requestTitle: string; // 申请标题快照
  amount: number; // 金额（正数）
  occurDate: string; // 发生日期
  operatorId: number | string;
  operatorName: string; // 审批人
  titleType: string; // 采购方式（自购/对公）
  applicantId: number | string;
  applicantName: string; // 申请人快照（=备用金出纳人）
  fundStatus?: string; // 资金状态（仅人工备用金流水有值）
  remark: string;
  createTime: string;
  updateTime: string;
}

export interface FundFlowQuery extends PageQuery {
  projectId: number | string | undefined;
  flowType: string | undefined;
  flowNo?: string; // 流水编号（模糊）
  requestTitle?: string; // 关键字：标题/编号
  titleType?: string; // 采购方式（自购/对公）
  applicantId?: number | string; // 备用金出纳人（精确）
  applicantName?: string; // 申请人（模糊）
  fundStatus?: string; // 资金状态（精确）
  params?: Record<string, any>;
}

/** 人工登记资金流水（非采购订单的资金消耗） */
export interface FundManualForm {
  titleType: '自购' | '对公';
  projectId: number | string;
  amount: number;
  remark?: string;
  /** 备用金出纳人（仅自购需要，有序，顺序即扣款顺序） */
  payers?: ReservePerson[];
}

/** 人工流水状态推进目标（单向：已采购未报销 → 已报销未汇款 → 已报销已汇款） */
export type ManualFundStatus = 'reimbursed_unpaid' | 'reimbursed_paid';

// 资金汇总
export interface FundProjectSummaryVO {
  projectId: number | string;
  projectName: string;
  budget: number; // 预算
  used: number; // 已用
  remaining: number; // 剩余
  monthOut: number; // 本月流出
  monthOutCount: number;
}

export interface FundSummaryVO {
  totalBudget: number;
  totalUsed: number;
  totalRemaining: number;
  monthOut: number;
  monthOutCount: number;
  projects: FundProjectSummaryVO[];
  /** 备用金账本（总额度/已占用/可用/已回笼），后端可能暂未返回 */
  reserve?: ReserveSummaryVO;
}

/** 资金状态看板：单个状态的笔数与金额合计 */
export interface FundStatusBoardVO {
  status: string;
  label: string; // 中文状态名（后端给）
  count: number;
  amount: number;
}

/** 资金状态变更动作：标记已报销 / 确认已汇款 */
export type FundStatusAction = 'reimburse' | 'paid';

export interface FundStatusForm {
  ids: Array<number | string>;
  action: FundStatusAction;
}
