/** 开票信息（对公必填，存 invoice_info_json） */
export interface InvoiceInfo {
  title: string; // 开票抬头
  taxNo: string; // 税号
  addressPhone: string; // 地址电话
  bankAccount: string; // 开户行账号
}

export interface RequestItemVO {
  id: number | string;
  requestId: number | string;
  purchaseType: string;
  category1: string;
  category2: string;
  itemName: string;
  spec: string;
  brand: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  materialUsage: string;
  purchaseReason: string;
  link: string;
  sortNo: number;
  remark: string;
  createTime: string;
  updateTime: string;
}

export interface RequestVO extends BaseEntity {
  id: number | string;
  requestCode: string;
  title: string;
  titleType: string;
  titleName: string;
  projectId: number | string;
  projectName: string;
  leader: string; // 项目负责人（自动带出）
  procurementContact: string; // 采购对接人（admin 配置，自动带出）
  currentApprover: string; // 当前审批人（流程动态）
  amount: number;
  purchaseType: string;
  applyReason: string;
  paymentScreenshot: string; // 付款截图（自购必填）
  quotationUrl: string; // 报价单（对公必填）
  invoiceInfo?: InvoiceInfo; // 开票信息（对公必填）
  remainingBudget?: number; // 项目剩余资金（后端带出，前端提示）
  status: string;
  acceptanceStatus?: string; // 验收标志 none/processing/done
  fundStatus?: string; // 资金状态（字典 pms_fund_status）
  reimbursementCode?: string; // 关联报销包编号（可空）
  reimburseDate?: string; // 报销标记时间
  reimburseBy?: number | string;
  reimburseByName?: string; // 报销标记人
  paidDate?: string; // 汇款确认时间
  paidBy?: number | string;
  paidByName?: string; // 汇款确认人
  processInstanceId: number | string;
  remark: string;
  items: RequestItemVO[];
}

export interface RequestItemForm {
  id: number | string | undefined;
  requestId: number | string | undefined;
  purchaseType: string;
  category1: string;
  category2: string;
  itemName: string;
  spec: string;
  brand: string;
  unit: string;
  quantity: number | undefined;
  unitPrice: number | undefined;
  amount: number | undefined;
  materialUsage: string;
  purchaseReason: string;
  link: string;
  sortNo: number | undefined;
  remark: string;
}

export interface RequestForm {
  id: number | string | undefined;
  requestCode: string;
  title: string;
  titleType: string;
  titleName: string;
  projectId: number | string | undefined;
  leader: string; // 只读展示（自动带出）
  procurementContact: string; // 只读展示（自动带出）
  currentApprover: string; // 当前审批人（流程动态）
  amount: number | undefined;
  purchaseType: string;
  applyReason: string;
  paymentScreenshot: string;
  quotationUrl: string;
  invoiceInfo: InvoiceInfo;
  status: string;
  remark: string;
  items: RequestItemForm[];
}

export interface RequestQuery extends PageQuery {
  requestCode: string;
  title: string;
  projectId: number | string | undefined;
  status: string;
  purchaseType: string;
  titleType?: string; // 采购方式（自购/对公，等值）
  fundStatus?: string; // 资金状态（字典 pms_fund_status，等值）
  applicantName?: string; // 申请人（模糊）
}
