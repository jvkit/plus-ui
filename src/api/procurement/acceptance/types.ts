/** 验收明细（pms_acceptance_item） */
export interface AcceptanceItemVO {
  id: number | string;
  acceptanceId: number | string;
  sourceItemId: number | string; // 关联采购申请明细 id（带出用）
  itemName: string; // 品名（只读，来自采购申请）
  spec: string; // 规格（只读）
  applyPrice: number; // 申请单价（只读）
  invoicePrice: number; // 发票金额（用户填）
  priceCheck: string; // pass/over（系统自动核对：发票金额<=申请单价为 pass，否则 over）
  photoUrl: string; // 实物图片（必填）
  invoiceUrl: string; // 发票附件（必填）
  result: string; // pass通过/over冲红
  remark: string;
  createTime: string;
  updateTime: string;
}

export interface AcceptanceItemForm {
  id: number | string | undefined;
  acceptanceId: number | string | undefined;
  sourceItemId: number | string | undefined; // 关联采购申请明细 id
  itemName: string; // 只读
  spec: string; // 只读
  applyPrice: number | undefined; // 只读
  invoicePrice: number | undefined; // 用户填
  priceCheck: string; // 自动核对
  photoUrl: string; // 必填
  invoiceUrl: string; // 必填
  result: string; // 通过/冲红
  remark: string;
}

export interface AcceptanceVO extends BaseEntity {
  id: number | string;
  acceptanceCode: string; // 验收编号（自动生成）
  requestId: number | string;
  requestCode: string; // 关联采购申请编号（后端带出）
  projectId: number | string;
  projectName: string; // 项目名称（后端带出）
  operator: string; // 验收操作人
  acceptanceDate: string; // 验收日期
  status: string; // pending待验收/partial部分验收/finished已完成/rejected不合格
  processInstanceId: number | string; // 流程实例ID
  currentApprover: string; // 当前审批人（流程动态）
  remark: string;
  aiDetail: string; // AI 发票识别留痕（JSON 数组，按轮次追加）
  items: AcceptanceItemVO[];
}

export interface AcceptanceForm {
  id: number | string | undefined;
  acceptanceCode: string; // 自动生成，前端不填
  requestId: number | string | undefined;
  projectId: number | string | undefined;
  projectName: string; // 只读展示
  operator: string;
  acceptanceDate: string;
  status: string;
  remark: string;
  aiDetail: string; // AI 发票识别留痕（JSON 数组，按轮次追加）
  items: AcceptanceItemForm[];
}

export interface AcceptanceQuery extends PageQuery {
  acceptanceCode: string;
  requestId: number | string | undefined;
  projectId: number | string | undefined;
  status: string;
}
