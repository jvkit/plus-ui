/**
 * BOM表(产品)（pms_bom_table）与其 BOM 节点（pms_bom_node）
 */
export interface BomTableVO extends BaseEntity {
  id: number | string;
  name: string; // 产品名称
  spec: string; // 规格型号（可空）
  projectId: number | string | undefined; // 关联项目（可空）
  projectName?: string; // 项目名称（后端带出）
  status: number; // 0停用/1正常
  remark: string;
}

export interface BomTableForm {
  id: number | string | undefined;
  name: string;
  spec: string;
  projectId: number | string | undefined;
  status: number;
  remark: string;
}

export interface BomTableQuery extends PageQuery {
  name: string;
  spec: string;
  projectId: number | string | undefined;
  status: number | undefined;
}

/**
 * BOM节点：group分组/item商品/product引用产品 三级语义
 */
export interface BomNodeVO extends BaseEntity {
  id: number | string;
  bomTableId: number | string;
  parentId: number | string; // 0=顶层
  nodeType: string; // group | item | product
  groupName: string; // 分组名（group时）
  catalogId: number | string | undefined; // 关联BOM库物料（item时）
  itemName: string; // 从物料带出，只读
  spec: string; // 从物料带出，只读
  brand: string; // 从物料带出，只读
  unit: string; // 从物料带出，只读
  qtyPerUnit: number | undefined; // 单套用量
  refPrice: number | undefined; // 参考单价
  stockQty: number | undefined; // 仓库库存（实时）
  refBomTableId: number | string | undefined; // 引用产品（product时）
  refBomTableName?: string; // 引用产品名称（后端带出）
  sortNo: number | undefined;
  remark: string;
  children?: BomNodeVO[];
}

export interface BomNodeForm {
  id: number | string | undefined;
  bomTableId: number | string | undefined;
  parentId: number | string | undefined;
  nodeType: string;
  groupName: string;
  catalogId: number | string | undefined;
  itemName: string;
  spec: string;
  brand: string;
  unit: string;
  qtyPerUnit: number | undefined;
  refPrice: number | undefined;
  stockQty: number | undefined;
  refBomTableId: number | string | undefined;
  sortNo: number | undefined;
  remark: string;
}
