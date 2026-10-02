// 备用金账户类型定义（额度 + 占用，按人一行）

/** 备用金汇总（资金汇总接口的 reserve 子对象 / 备用金汇总接口） */
export interface ReserveSummaryVO {
  totalQuota: number; // 总额度
  occupied: number; // 已占用（自购且未回笼）
  available: number; // 可用 = 总额度 - 已占用
  recycled: number; // 已回笼（已报销已汇款金额合计）
}

/** 备用金账户（occupied/available 由后端实时聚合，不入库） */
export interface ReserveAccountVO {
  id: number | string;
  personId: number | string;
  personName: string; // 人员姓名快照
  quota: number; // 额度
  occupied: number; // 已占用
  available: number; // 可用
  unreimbursedCount: number; // 未报销笔数
  recycled: number; // 已回笼
  remark?: string;
  createTime?: string;
  updateTime?: string;
}

/** 新增：{ personId, quota?, remark? }；改额度：{ id, quota, remark } */
export interface ReserveForm {
  id?: number | string;
  personId?: number | string;
  quota?: number;
  remark?: string;
}

/** 选人下拉项 */
export interface ReserveUserOption {
  userId: number | string;
  nickName: string;
}

/** 备用金扣款人（顺序即扣款顺序，申请单 reservePeopleJson 的元素结构） */
export interface ReservePerson {
  personId: number | string;
  personName: string;
}

/** 备用金平铺选人选项（/reserve/options，登录即可用；数字与账户列表一致） */
export interface ReserveOptionVO {
  personId: number | string;
  personName: string;
  quota: number; // 额度
  occupied: number; // 已用（已占用）
  available: number; // 可用
}
