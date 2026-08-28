export interface ProjectVO extends BaseEntity {
  id: number | string;
  parentId: number | string;
  children?: ProjectVO[];
  projectCode: string;
  projectName: string;
  deptId: number | string; // 归属部门ID
  deptName: string; // 归属部门名称
  leader: string;
  leaderId: number | string; // 项目负责人用户ID
  budget: number;
  usedAmount: number; // 已用金额（系统累计）
  remaining: number; // 剩余资金 = budget - usedAmount（前端计算，不入库）
  startDate: string;
  endDate: string;
  status: number;
  remark: string;
  level?: number;
}

export interface ProjectForm {
  id: number | string | undefined;
  parentId: number | string | undefined;
  projectCode: string;
  projectName: string;
  deptId: number | string | undefined; // 归属部门ID
  leader: string;
  leaderId: number | string | undefined; // 项目负责人用户ID
  budget: number | undefined;
  usedAmount?: number | undefined; // 只读，不参与编辑提交
  startDate: string;
  endDate: string;
  status: number;
  remark: string;
}

export interface ProjectQuery extends PageQuery {
  projectCode: string;
  projectName: string;
  leader: string;
  status: number | undefined;
}
