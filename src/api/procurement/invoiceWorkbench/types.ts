export type InvoiceWorkbenchStatus = 'none' | 'processing' | 'done';

export interface InvoiceWorkbenchVO {
  requestId: string | number;
  requestCode?: string;
  requestTitle?: string;
  projectName?: string;
  applicantName?: string;
  acceptanceId?: string | number;
  acceptanceCode?: string;
  acceptanceDate?: string;
  itemTotal?: number;
  itemCovered?: number;
  invoiceTotal?: number;
  invoiceValid?: number;
  status?: InvoiceWorkbenchStatus;
  doneFlag?: number | boolean;
  doneTime?: string;
  doneBy?: string;
  lastInvoiceTime?: string;
}

export interface InvoiceWorkbenchQuery {
  pageNum: number;
  pageSize: number;
  /** unfinished=未上传+正在上传；none/processing/done 精确状态；空串=全部 */
  status?: string;
  projectId?: string | number;
  keyword?: string;
}
