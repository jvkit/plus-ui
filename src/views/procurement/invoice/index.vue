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
            <el-form-item label="关联申请" prop="requestId">
              <el-select v-model="queryParams.requestId" placeholder="请选择关联申请" clearable filterable style="width: 220px">
                <el-option v-for="item in acceptedRequests" :key="item.id" :label="requestOptionLabel(item)" :value="item.id" />
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
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="invoiceList">
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
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- PDF 预览弹窗（台账表格用） -->
    <el-dialog v-model="pdfDialog.visible" title="发票 PDF 预览" width="900px" append-to-body>
      <iframe v-if="pdfDialog.url" :src="pdfDialog.url" style="width: 100%; height: 70vh; border: none"></iframe>
    </el-dialog>

    <!-- 发票匹配台（独立组件，与工作台共用） -->
    <invoice-match-dialog v-model:visible="matchVisible" :request-id="matchRequestId" @refresh="getList" />
  </div>
</template>

<script setup name="ProcurementInvoice" lang="ts">
import { listProcurementInvoice } from '@/api/procurement/invoice';
import { ProcurementInvoiceQuery, ProcurementInvoiceVO } from '@/api/procurement/invoice/types';
import { treeProject } from '@/api/procurement/project';
import { reimbursableRequestList } from '@/api/procurement/reimbursement';
import request from '@/utils/request';
import { useRoute } from 'vue-router';
import InvoiceMatchDialog from './matchDialog.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();

const invoiceList = ref<ProcurementInvoiceVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const projectOptions = ref<any[]>([]);
const acceptedRequests = ref<any[]>([]);

const pdfDialog = reactive({
  visible: false,
  url: ''
});

/** 发票匹配台显隐与预选申请 */
const matchVisible = ref(false);
const matchRequestId = ref<number | string | undefined>(undefined);

const queryFormRef = ref<ElFormInstance>();

const initQueryParams: ProcurementInvoiceQuery = {
  pageNum: 1,
  pageSize: 10,
  invoiceNumber: '',
  sellerName: '',
  buyerName: '',
  invoiceType: '',
  validFlag: 1 // 默认只显示有效发票
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

/** 关联申请下拉选项显示：编号（标题） */
const requestOptionLabel = (item: any) => (item.requestCode || '') + (item.title ? '（' + item.title + '）' : '');

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

/** 加载已验收完成的申请列表（搜索筛选用；匹配台组件内部自带一份） */
const loadAcceptedRequests = async () => {
  if (acceptedRequests.value.length > 0) return;
  const res = await reimbursableRequestList();
  acceptedRequests.value = res.data || [];
};

/** 预选/筛选的申请不在下拉列表中时补一个兜底选项，保证能正常回显 */
const ensureRequestOption = (id: number | string) => {
  if (!acceptedRequests.value.some((r: any) => String(r.id) === String(id))) {
    acceptedRequests.value.unshift({ id, requestCode: '当前申请', title: '' });
  }
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

onMounted(async () => {
  // 支持带参进入：?requestId=xxx&openUpload=1 自动打开发票匹配台
  const queryRequestId = route.query.requestId ? String(route.query.requestId) : '';
  if (queryRequestId) {
    queryParams.value.requestId = queryRequestId;
  }
  await Promise.all([getList(), loadOptions(), loadAcceptedRequests()]);
  if (queryRequestId) {
    ensureRequestOption(queryRequestId);
  }
  if (route.query.openUpload === '1') {
    matchRequestId.value = queryRequestId || undefined;
    matchVisible.value = true;
  }
});
</script>
