/** 流转记录（pms_operation_log，系统自动写入，只读） */
export interface OperationLogVO extends BaseEntity {
  id: number | string;
  bizType: string; // 业务类型：request采购申请/acceptance验收/issue领用/stock仓库
  bizId: number | string; // 业务ID
  action: string; // 操作动作
  operator: number | string; // 操作人
  operatorName: string; // 操作人姓名
  operateTime: string; // 操作时间
  remark: string; // 备注
  fromStatus: string; // 操作前状态
  toStatus: string; // 操作后状态
}

export interface OperationLogQuery extends PageQuery {
  bizType: string;
  operatorName: string;
}
