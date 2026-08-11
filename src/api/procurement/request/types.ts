export interface RequestItemVO {
  id: number | string;
  requestId: number | string;
  purchaseType: string;
  category1: string;
  category2: string;
  projectBelong: string;
  itemName: string;
  spec: string;
  brand: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  bomItemId: number | string;
  sortNo: number;
  link: string;
  platform: string;
  supplierId: number | string;
  supplierName: string;
  remark: string;
  createTime: string;
  updateTime: string;
}

export interface RequestVO extends BaseEntity {
  id: number | string;
  requestCode: string;
  title: string;
  projectId: number | string;
  projectName: string;
  supplierId: number | string;
  supplierName: string;
  amount: number;
  purchaseType: string;
  applyReason: string;
  status: string;
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
  projectBelong: string;
  itemName: string;
  spec: string;
  brand: string;
  unit: string;
  quantity: number | undefined;
  unitPrice: number | undefined;
  amount: number | undefined;
  bomItemId: number | string | undefined;
  sortNo: number | undefined;
  link: string;
  platform: string;
  supplierId: number | string | undefined;
  remark: string;
}

export interface RequestForm {
  id: number | string | undefined;
  requestCode: string;
  title: string;
  projectId: number | string | undefined;
  supplierId: number | string | undefined;
  amount: number | undefined;
  purchaseType: string;
  applyReason: string;
  status: string;
  remark: string;
  items: RequestItemForm[];
}

export interface RequestQuery extends PageQuery {
  requestCode: string;
  title: string;
  projectId: number | string | undefined;
  supplierId: number | string | undefined;
  status: string;
  purchaseType: string;
}
