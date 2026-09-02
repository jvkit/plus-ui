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
            <span>{{ scope.row.invoiceDate ? proxy.parseTime(scope.row.invoiceDate, '{y}-{m}-{d}') : '-' }}</span>
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
        <el-table-column label="关联验收单" align="center" prop="acceptanceCode" width="140" :show-overflow-tooltip="true" />
        <el-table-column label="关联申请" align="center" prop="requestTitle" width="160" :show-overflow-tooltip="true" />
        <el-table-column label="项目归属" align="center" prop="projectName" width="160" :show-overflow-tooltip="true" />
        <el-table-column label="无效原因" align="center" prop="invalidReason" :show-overflow-tooltip="true" width="160" />
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
  </div>
</template>

<script setup name="ProcurementInvoice" lang="ts">
import { listProcurementInvoice, delProcurementInvoice } from '@/api/procurement/invoice';
import { ProcurementInvoiceQuery, ProcurementInvoiceVO } from '@/api/procurement/invoice/types';
import { treeProject } from '@/api/procurement/project';
import request from '@/utils/request';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const invoiceList = ref<ProcurementInvoiceVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const projectOptions = ref<any[]>([]);

const pdfDialog = reactive({
  visible: false,
  url: ''
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
