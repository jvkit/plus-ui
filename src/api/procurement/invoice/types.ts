export interface ProcurementInvoiceVO {
  id: string | number;
  invoiceCode?: string;
  invoiceNumber?: string;
  invoiceType?: string;
  amount?: number;
  taxAmount?: number;
  totalAmount?: number;
  invoiceDate?: string;
  sellerName?: string;
  buyerName?: string;
  status?: string;
  redFlag?: number;
  validFlag?: number;
  invalidReason?: string;
  acceptanceId?: string | number;
  requestId?: string | number;
  projectId?: string | number;
  pdfUrl?: string;
  pdfOssId?: string;
  ocrJson?: string;
  remark?: string;
  createTime?: string;
}

export interface ProcurementInvoiceQuery {
  pageNum: number;
  pageSize: number;
  invoiceNumber?: string;
  sellerName?: string;
  buyerName?: string;
  invoiceType?: string;
  validFlag?: number;
  redFlag?: number;
  acceptanceId?: string | number;
  requestId?: string | number;
  projectId?: string | number;
}
