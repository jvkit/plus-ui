export interface WarehouseVO extends BaseEntity {
  id: number | string;
  itemName: string; // 品名
  spec: string; // 规格
  brand: string; // 品牌
  unit: string; // 单位
  qtyAvailable: number; // 可用数量
  sourceItemId: number | string; // 关联采购明细 id
  projectId: number | string;
  projectName: string; // 项目名称（后端带出）
  inboundDate: string; // 入库日期
  photoUrl?: string; // 验收图片 OSS ID（后端带回显）
  remark: string;
}

export interface WarehouseForm {
  id: number | string | undefined;
  itemName: string;
  spec: string;
  brand: string;
  unit: string;
  qtyAvailable: number | undefined; // 可用数量（编辑时提交）
  quantity: number | undefined; // 手动入库数量（新增时提交，后端累加入库）
  sourceItemId: number | string | undefined;
  projectId: number | string | undefined;
  inboundDate: string;
  remark: string;
}

export interface WarehouseQuery extends PageQuery {
  itemName: string;
  spec: string;
  projectId: number | string | undefined;
}
