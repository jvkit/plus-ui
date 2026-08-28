/** 开票信息（对公，存 invoice_info_json） */
export interface ContractInvoiceInfo {
  title: string; // 开票抬头
  taxNo: string; // 税号
  addressPhone: string; // 地址电话
  bankAccount: string; // 开户行账号
}

/** 物料明细（存 items_json） */
export interface ContractItemVO {
  id: number | string;
  itemName: string;
  spec: string;
  brand: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/** 采购合同（pms_purchase_contract） */
export interface ContractVO extends BaseEntity {
  id: number | string;
  contractNo: string; // 合同编号（自动 ctrt-...）
  requestId: number | string; // 关联采购申请
  requestCode: string; // 关联申请编号（列表展示）
  title: string; // 合同标题
  invoiceInfoJson: string; // 开票信息（JSON 字符串）
  itemsJson: string; // 物料明细（JSON 字符串）
  amount: number; // 合同总金额
  quotationUrl: string; // 报价单附件
  content: string; // 合同内容（模板渲染）
  fileUrl: string; // 合同文件
  status: string; // draft草稿/generated已生成/sent已发送
  generateTime: string; // 生成时间
}

export interface ContractForm {
  id: number | string | undefined;
  contractNo: string;
  requestId: number | string | undefined;
  title: string;
  invoiceInfoJson: string;
  itemsJson: string;
  amount: number | undefined;
  quotationUrl: string;
  content: string;
  fileUrl: string;
  status: string;
  generateTime: string;
}

export interface ContractQuery extends PageQuery {
  contractNo: string;
  title: string;
  status: string;
}
