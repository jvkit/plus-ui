<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="发票号码" prop="invoiceNumber">
              <el-input v-model="queryParams.invoiceNumber" placeholder="请输入发票号码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="销售方" prop="sellerName">
              <el-input v-model="queryParams.sellerName" placeholder="请输入销售方名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="购买方" prop="buyerName">
              <el-input v-model="queryParams.buyerName" placeholder="请输入购买方名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="项目" prop="projectId">
              <el-select v-model="queryParams.projectId" placeholder="请选择项目" clearable filterable style="width: 180px">
                <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="发票类型" prop="invoiceType">
              <el-select v-model="queryParams.invoiceType" placeholder="发票类型" clearable style="width: 140px">
                <el-option label="增值税专用发票" value="增值税专用发票" />
                <el-option label="增值税普通发票" value="增值税普通发票" />
                <el-option label="电子发票" value="电子发票" />
                <el-option label="数电票" value="数电票" />
              </el-select>
            </el-form-item>
            <el-form-item label="有效性" prop="validFlag">
              <el-select v-model="queryParams.validFlag" placeholder="有效性" clearable style="width: 120px">
                <el-option label="有效发票" :value="1" />
                <el-option label="无效发票" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </transition>
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:invoice:upload']" type="primary" plain icon="Upload" @click="openUpload">上传发票</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:invoice:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="invoiceList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column label="发票号码" align="center" prop="invoiceNumber" :show-overflow-tooltip="true" />
        <el-table-column label="发票类型" align="center" prop="invoiceType" :show-overflow-tooltip="true" />
        <el-table-column label="不含税金额" align="center" prop="amount" />
        <el-table-column label="税额" align="center" prop="taxAmount" />
        <el-table-column label="价税合计" align="center" prop="totalAmount" />
        <el-table-column label="开票日期" align="center" prop="invoiceDate" width="120">
          <template #default="scope">
            <span>{{ parseDate(scope.row.invoiceDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="销售方" align="center" prop="sellerName" :show-overflow-tooltip="true" />
        <el-table-column label="购买方" align="center" prop="buyerName" :show-overflow-tooltip="true" />
        <el-table-column label="是否冲红" align="center" prop="redFlag" width="90">
          <template #default="scope">
            <el-tag :type="scope.row.redFlag === 1 ? 'danger' : 'info'">{{ scope.row.redFlag === 1 ? '冲红' : '正常' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="有效性" align="center" prop="validFlag" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.validFlag === 1 ? 'success' : 'danger'">{{ scope.row.validFlag === 1 ? '有效' : '无效' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="商品名称" align="center" prop="matchedItems" :show-overflow-tooltip="true" width="160" />
        <el-table-column label="关联验收单" align="center" prop="acceptanceCode" width="140" :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ scope.row.acceptanceCode || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="关联申请" align="center" prop="requestTitle" width="160" :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ scope.row.requestTitle || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="项目归属" align="center" prop="projectName" width="160" :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ scope.row.projectName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="无效原因" align="center" prop="invalidReason" :show-overflow-tooltip="true" width="160">
          <template #default="scope">
            <span>{{ scope.row.invalidReason || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="PDF" align="center" width="100">
          <template #default="scope">
            <el-button v-if="scope.row.pdfUrl || scope.row.pdfOssId" link type="primary" icon="View" @click="previewPdf(scope.row)">查看</el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['procurement:invoice:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- PDF 预览弹窗 -->
    <el-dialog v-model="pdfDialog.visible" title="发票 PDF 预览" width="900px" append-to-body>
      <iframe v-if="pdfDialog.url" :src="pdfDialog.url" style="width: 100%; height: 70vh; border: none"></iframe>
    </el-dialog>

    <!-- 上传发票弹窗 -->
    <el-dialog v-model="uploadDialog.visible" title="上传发票" width="860px" append-to-body :close-on-click-modal="false">
      <el-form label-width="100px">
        <el-form-item label="关联申请">
          <el-select v-model="uploadDialog.requestId" placeholder="请选择已验收完成的采购申请（可留空做自由上传）" filterable clearable style="width: 100%" @change="onUploadRequestChange">
            <el-option v-for="item in acceptedRequests" :key="item.id" :label="item.requestCode + '（' + item.title + '）'" :value="item.id" />
          </el-select>
          <div class="text-xs text-gray-400">选择后可按明细逐条挂载，或使用 AI 一键匹配；不选则仅做台账登记</div>
        </el-form-item>
      </el-form>

      <el-tabs v-model="uploadDialog.tab">
        <el-tab-pane label="AI 一键匹配" name="ai">
          <el-alert type="info" :closable="false" show-icon class="mb-2">
            <template #title>
              上传多张发票 PDF（可一次多张，也可分多轮补充）。系统自动识别票面字段并按商品名匹配，匹配成功的自动写入台账；冲红票会标记「冲红」；不相干的发票记为无效发票。
            </template>
          </el-alert>
          <el-alert v-if="!uploadDialog.requestId" type="warning" :closable="false" show-icon class="mb-2">
            <template #title>AI 匹配需要先选择关联申请，才能带出待匹配的商品明细。</template>
          </el-alert>
          <div class="mb-2">
            <el-upload ref="uploadRef" multiple drag :auto-upload="false" :limit="20" accept=".pdf" v-model:file-list="uploadDialog.fileList">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">将发票 PDF 拖到此处，或<em>点击选择</em></div>
              <template #tip>
                <div class="el-upload__tip">仅支持 PDF，可一次多张；每轮识别后队列自动清空</div>
              </template>
            </el-upload>
          </div>
          <div v-if="uploadDialog.report && uploadDialog.report.length" class="ai-report">
            <div class="ai-report-title">本轮识别结果</div>
            <el-alert v-for="(line, i) in uploadDialog.report" :key="i" :closable="false" show-icon class="mb-1"
              :type="line.includes('✅') ? 'success' : (line.includes('❌') ? 'error' : 'warning')">
              <template #title>{{ line }}</template>
            </el-alert>
          </div>
        </el-tab-pane>

        <el-tab-pane label="手动挂载" name="manual">
          <el-alert type="info" :closable="false" show-icon class="mb-2">
            <template #title>不走 AI：先选一条验收明细，再选择发票 PDF，直接登记到台账并关联该商品。</template>
          </el-alert>
          <el-form label-width="100px">
            <el-form-item label="验收明细">
              <el-select v-model="uploadDialog.itemId" placeholder="请选择验收明细" filterable clearable style="width: 100%" :disabled="!uploadDialog.items.length">
                <el-option v-for="it in uploadDialog.items" :key="it.id" :label="it.itemName + (it.spec ? '（' + it.spec + '）' : '')" :value="it.id" />
              </el-select>
              <div class="text-xs text-gray-400">{{ uploadDialog.items.length ? '共 ' + uploadDialog.items.length + ' 条明细' : '请先选择关联申请' }}</div>
            </el-form-item>
          </el-form>
          <div class="mb-2">
            <el-upload ref="manualUploadRef" multiple drag :auto-upload="false" :limit="20" accept=".pdf" v-model:file-list="uploadDialog.manualFileList">
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">将发票 PDF 拖到此处，或<em>点击选择</em></div>
              <template #tip>
                <div class="el-upload__tip">仅支持 PDF</div>
              </template>
            </el-upload>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="uploadDialog.tab === 'ai'" type="primary" :loading="uploadDialog.loading" @click="startAiMatch">开始识别</el-button>
          <el-button v-else type="primary" :loading="uploadDialog.loading" @click="startManualUpload">上传登记</el-button>
          <el-button @click="closeUpload">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ProcurementInvoice" lang="ts">
import { listProcurementInvoice, delProcurementInvoice, manualUploadInvoice } from '@/api/procurement/invoice';
import { ProcurementInvoiceQuery, ProcurementInvoiceVO } from '@/api/procurement/invoice/types';
import { treeProject } from '@/api/procurement/project';
import { listAcceptance } from '@/api/procurement/acceptance';
import { reimbursableRequestList } from '@/api/procurement/reimbursement';
import request from '@/utils/request';
import { UploadUserFile } from 'element-plus';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const invoiceList = ref<ProcurementInvoiceVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const projectOptions = ref<any[]>([]);
const acceptedRequests = ref<any[]>([]);

const pdfDialog = reactive({
  visible: false,
  url: ''
});

const uploadDialog = reactive<{
  visible: boolean;
  tab: string;
  requestId: number | string | undefined;
  acceptanceId: number | string | undefined;
  itemId: number | string | undefined;
  items: any[];
  fileList: UploadUserFile[];
  manualFileList: UploadUserFile[];
  report: string[] | null;
  loading: boolean;
}>({
  visible: false,
  tab: 'ai',
  requestId: undefined,
  acceptanceId: undefined,
  itemId: undefined,
  items: [],
  fileList: [],
  manualFileList: [],
  report: null,
  loading: false
});

const queryFormRef = ref<ElFormInstance>();

const initQueryParams: ProcurementInvoiceQuery = {
  pageNum: 1,
  pageSize: 10,
  invoiceNumber: '',
  sellerName: '',
  buyerName: '',
  invoiceType: '',
  validFlag: undefined as unknown as number // 默认不筛选，全部显示（含无效发票）
};

const data = reactive<PageData<any, ProcurementInvoiceQuery>>({
  form: {},
  queryParams: { ...initQueryParams },
  rules: {}
});

const { queryParams, form, rules } = toRefs(data);

/** 日期格式化：兼容 ISO 带时区串（如 2026-01-21T00:00:00.000+08:00） */
const parseDate = (val?: string) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).slice(0, 10);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** 查询采购发票台账列表 */
const getList = async () => {
  loading.value = true;
  const res = await listProcurementInvoice(queryParams.value);
  // 后端返回 R<PageResult>：{ code, data: { rows, total } }
  invoiceList.value = res.data?.rows ?? [];
  total.value = res.data?.total ?? 0;
  loading.value = false;
};

/** 加载项目树（普通用户无 project:list 权限，统一走 tree 接口并展平） */
const flattenTree = (nodes: any[]): any[] => {
  const out: any[] = [];
  const walk = (list: any[]) => {
    for (const n of list || []) {
      out.push(n);
      walk(n.children || []);
    }
  };
  walk(nodes);
  return out;
};
const loadOptions = async () => {
  const projectRes = await treeProject();
  projectOptions.value = flattenTree(projectRes.data || []);
};

/** PDF 预览：优先用 pdfUrl，否则用 pdfOssId 调接口取 URL */
const previewPdf = async (row: ProcurementInvoiceVO) => {
  if (row.pdfUrl) {
    pdfDialog.url = row.pdfUrl;
    pdfDialog.visible = true;
    return;
  }
  if (row.pdfOssId) {
    const res = await request({
      url: '/system/oss/' + row.pdfOssId,
      method: 'get'
    });
    pdfDialog.url = res.data.url || '';
    pdfDialog.visible = true;
  }
};

/** 打开上传弹窗 */
const openUpload = async () => {
  uploadDialog.tab = 'ai';
  uploadDialog.requestId = undefined;
  uploadDialog.acceptanceId = undefined;
  uploadDialog.itemId = undefined;
  uploadDialog.items = [];
  uploadDialog.fileList = [];
  uploadDialog.manualFileList = [];
  uploadDialog.report = null;
  uploadDialog.visible = true;
  if (acceptedRequests.value.length === 0) {
    const res = await reimbursableRequestList();
    acceptedRequests.value = res.data || [];
  }
};

/** 选择关联申请：查该申请下最新已验收完成单，带出明细供手动挂载 */
const onUploadRequestChange = async (val: number | string | undefined) => {
  uploadDialog.itemId = undefined;
  uploadDialog.items = [];
  uploadDialog.acceptanceId = undefined;
  if (!val) return;
  const res: any = await listAcceptance({ requestId: val, pageNum: 1, pageSize: 20 });
  const rows: any[] = res.data?.rows || res.data || [];
  const finished = rows.filter((r) => r.status === 'finish');
  const target = finished[0] || rows[0];
  if (!target) return;
  uploadDialog.acceptanceId = target.id;
  uploadDialog.items = target.items || [];
};

/** 关闭上传弹窗 */
const closeUpload = () => {
  uploadDialog.visible = false;
  uploadDialog.fileList = [];
  uploadDialog.manualFileList = [];
  uploadDialog.report = null;
};

/** AI 一键匹配：复用验收模块的 AI 识别端点 */
const startAiMatch = async () => {
  const files = uploadDialog.fileList.filter((f) => f.raw).map((f) => f.raw as File);
  if (files.length === 0) {
    proxy?.$modal.msgError('请先选择发票 PDF 文件');
    return;
  }
  if (!uploadDialog.requestId) {
    proxy?.$modal.msgError('请先选择关联申请');
    return;
  }
  const items = (uploadDialog.items || []).map((it: any) => ({
    id: it.sourceItemId ?? it.id,
    itemName: it.itemName,
    spec: it.spec,
    applyPrice: Number(it.applyPrice) || 0,
    quantity: 1
  }));
  uploadDialog.loading = true;
  uploadDialog.report = null;
  try {
    const formData = new FormData();
    if (uploadDialog.acceptanceId) formData.append('acceptanceId', String(uploadDialog.acceptanceId));
    formData.append('requestId', String(uploadDialog.requestId));
    formData.append('items', JSON.stringify(items));
    files.forEach((f) => formData.append('files', f));
    const res: any = await request({
      url: '/procurement/acceptance/ai-invoice-match',
      method: 'post',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000
    });
    const data = res.data || res;
    uploadDialog.report = data.summary?.lines || [];
    uploadDialog.fileList = [];
    proxy?.$modal.msgSuccess(`识别完成：匹配 ${data.summary?.matchedInvoiceCount ?? 0} 张发票`);
    await getList();
  } catch (e: any) {
    proxy?.$modal.msgError('AI 识别失败：' + (e?.message || '请稍后重试'));
  } finally {
    uploadDialog.loading = false;
  }
};

/** 手动挂载：不走 AI，直接登记到台账 */
const startManualUpload = async () => {
  const files = uploadDialog.manualFileList.filter((f) => f.raw).map((f) => f.raw as File);
  if (files.length === 0) {
    proxy?.$modal.msgError('请先选择发票 PDF 文件');
    return;
  }
  uploadDialog.loading = true;
  try {
    await manualUploadInvoice({
      acceptanceId: uploadDialog.acceptanceId,
      requestId: uploadDialog.requestId,
      acceptanceItemId: uploadDialog.itemId,
      files
    });
    uploadDialog.manualFileList = [];
    proxy?.$modal.msgSuccess('上传成功');
    await getList();
  } catch (e: any) {
    proxy?.$modal.msgError('上传失败：' + (e?.message || '请稍后重试'));
  } finally {
    uploadDialog.loading = false;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  queryParams.value = { ...initQueryParams };
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: ProcurementInvoiceVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 删除按钮操作 */
const handleDelete = async (row?: ProcurementInvoiceVO) => {
  const idList = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除选中的发票台账记录？');
  await delProcurementInvoice(idList);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
  loadOptions();
});
</script>

<style scoped>
.ai-report-title {
  font-weight: 600;
  margin-bottom: 6px;
}
</style>
