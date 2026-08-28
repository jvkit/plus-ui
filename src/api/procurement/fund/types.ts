// 资金流水类型定义
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
  remark: string;
  createTime: string;
  updateTime: string;
}

export interface FundFlowQuery extends PageQuery {
  projectId: number | string | undefined;
  flowType: string | undefined;
  requestTitle: string | undefined; // 关键字：标题/编号
  params?: Record<string, any>;
}

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
}
