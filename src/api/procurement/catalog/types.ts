/**
 * BOM物料库（pms_bom_catalog）：筛选测试 OK 的物料档案，区别于仓库
 */
export interface CatalogVO extends BaseEntity {
  id: number | string;
  itemName: string; // 品名
  spec: string; // 规格
  brand: string; // 品牌
  unit: string; // 单位
  refPrice: number | undefined; // 参考单价
  category: string; // 分类：材料/设备/其他
  link: string; // 产品链接
  projectId: number | string | undefined; // 关联项目（可空）
  projectName?: string; // 项目名称（后端带出）
  stockId: number | string | undefined; // 关联仓库库存（可空，模糊搜索）
  status: number; // 0停用/1正常
  remark: string;
}

export interface CatalogForm {
  id: number | string | undefined;
  itemName: string;
  spec: string;
  brand: string;
  unit: string;
  refPrice: number | undefined;
  category: string;
  link: string;
  projectId: number | string | undefined;
  stockId: number | string | undefined;
  status: number;
  remark: string;
}

export interface CatalogQuery extends PageQuery {
  itemName: string;
  spec: string;
  brand: string;
  category: string;
  projectId: number | string | undefined;
  stockId: number | string | undefined;
  status: number | undefined;
}
