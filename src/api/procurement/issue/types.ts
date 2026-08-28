export interface IssueVO extends BaseEntity {
  id: number | string;
  issueCode: string; // 领用编号（自动生成）
  stockId: number | string; // 选库存物料
  itemName: string; // 品名（选库存后自动带出）
  spec: string; // 规格（自动带出）
  qtyAvailable: number; // 当前库存（只读）
  qtyRequested: number; // 领用数量
  purpose: string; // 用途
  applicant: string; // 申请人
  approver: string; // 审批人
  status: string; // pending待审/approved已通过/rejected已拒绝/issued已出库
  processInstanceId: number | string; // 流程实例ID
  currentApprover: string; // 当前审批人（流程动态）
  approveTime: string; // 审批时间
  remark: string;
}

export interface IssueForm {
  id: number | string | undefined;
  issueCode: string; // 自动生成，前端不填
  stockId: number | string | undefined;
  itemName: string; // 只读
  spec: string; // 只读
  qtyAvailable: number | undefined; // 只读
  qtyRequested: number | undefined;
  purpose: string;
  applicant: string;
  approver: string;
  status: string;
  processInstanceId: number | string | undefined;
  approveTime: string;
  remark: string;
}

export interface IssueQuery extends PageQuery {
  issueCode: string;
  itemName: string;
  status: string;
}
