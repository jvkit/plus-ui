/** 报销导出（pms_reimbursement） */
export interface ReimbursementVO extends BaseEntity {
  id: number | string;
  reimbursementCode: string; // 报销编号（自动 reim-...）
  requestId: number | string; // 关联采购申请
  requestCode: string; // 关联申请编号（列表展示）
  acceptanceId: number | string; // 关联验收单
  projectId: number | string; // 项目
  projectName: string; // 项目名称（列表展示）
  applicant: string; // 申请人
  fileUrl: string; // 打包文件
  contentJson: string; // 包含内容（JSON 字符串）
  status: string; // packing打包中/packed已打包/sent已发送
}

export interface ReimbursementForm {
  id: number | string | undefined;
  reimbursementCode: string;
  requestId: number | string | undefined;
  acceptanceId: number | string | undefined;
  projectId: number | string | undefined;
  applicant: string;
  fileUrl: string;
  contentJson: string;
  status: string;
}

export interface ReimbursementQuery extends PageQuery {
  reimbursementCode: string;
  requestId: number | string | undefined;
  projectId: number | string | undefined;
  applicant: string;
  status: string;
}
