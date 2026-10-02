<template>
  <div class="p-2">
    <div v-show="showSearch" class="mb-[10px]">
      <el-card shadow="hover">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true">
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="上传状态" style="width: 130px">
              <el-option label="未完成" value="unfinished" />
              <el-option label="未上传" value="none" />
              <el-option label="正在上传" value="processing" />
              <el-option label="已完成" value="done" />
              <el-option label="全部" value="" />
            </el-select>
          </el-form-item>
          <el-form-item label="项目" prop="projectId">
            <el-select v-model="queryParams.projectId" placeholder="请选择项目" clearable filterable style="width: 180px">
              <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键字" prop="keyword">
            <el-input v-model="queryParams.keyword" placeholder="申请编号 / 标题" clearable style="width: 180px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    <el-card shadow="hover">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="workbenchList">
        <el-table-column label="申请编号" align="center" prop="requestCode" width="170" :show-overflow-tooltip="true" />
        <el-table-column label="标题" align="center" prop="requestTitle" :show-overflow-tooltip="true" />
        <el-table-column label="项目" align="center" prop="projectName" :show-overflow-tooltip="true" />
        <el-table-column label="验收单号" align="center" prop="acceptanceCode" width="150" :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ scope.row.acceptanceCode || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="明细覆盖" align="center" width="110">
          <template #default="scope">
            <el-tag :type="coverageTagType(scope.row)" size="small">
              {{ scope.row.itemCovered ?? 0 }} / {{ scope.row.itemTotal ?? 0 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发票（有效/总）" align="center" width="120">
          <template #default="scope">
            <span>{{ scope.row.invoiceValid ?? 0 }} / {{ scope.row.invoiceTotal ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="110">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">{{ statusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最近上传时间" align="center" width="170">
          <template #default="scope">
            <span>{{ formatTime(scope.row.lastInvoiceTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-button link type="primary" icon="Upload" @click="goInvoicePage(scope.row)">上传发票</el-button>
            <el-button v-if="scope.row.status !== 'done'" link type="success" icon="CircleCheck" @click="handleToggleDone(scope.row, true)">标记完成</el-button>
            <el-button v-else link type="warning" icon="CircleClose" @click="handleToggleDone(scope.row, false)">取消完成</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 发票匹配台（与台账页共用，本页直接弹窗不再跳转） -->
    <invoice-match-dialog v-model:visible="matchVisible" :request-id="matchRequestId" @refresh="getList" />
  </div>
</template>

<script setup name="InvoiceWorkbench" lang="ts">
import { listInvoiceWorkbench, updateInvoiceWorkbenchDoneFlag } from '@/api/procurement/invoiceWorkbench';
import type { InvoiceWorkbenchQuery, InvoiceWorkbenchVO } from '@/api/procurement/invoiceWorkbench/types';
import { treeProject } from '@/api/procurement/project';
import InvoiceMatchDialog from '@/views/procurement/invoice/matchDialog.vue';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const workbenchList = ref<InvoiceWorkbenchVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const projectOptions = ref<any[]>([]);

/** 发票匹配台显隐与预选申请 */
const matchVisible = ref(false);
const matchRequestId = ref<number | string | undefined>(undefined);

const queryFormRef = ref<ElFormInstance>();

const initQueryParams: InvoiceWorkbenchQuery = {
  pageNum: 1,
  pageSize: 10,
  status: 'unfinished',
  projectId: undefined,
  keyword: ''
};

const data = reactive<PageData<any, InvoiceWorkbenchQuery>>({
  form: {},
  queryParams: { ...initQueryParams },
  rules: {}
});

const { queryParams } = toRefs(data);

/** 时间格式化：本地时区 yyyy-MM-dd HH:mm:ss，非法/空值原样兜底 */
const formatTime = (val?: string) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const statusLabel = (status?: any) => {
  if (status === 'done') return '已完成';
  if (status === 'processing') return '正在上传';
  return '未上传';
};

const statusTagType = (status?: any): 'success' | 'warning' | 'info' => {
  if (status === 'done') return 'success';
  if (status === 'processing') return 'warning';
  return 'info';
};

const coverageTagType = (row: any): 'success' | 'warning' | 'info' => {
  const covered = Number(row?.itemCovered) || 0;
  const totalItems = Number(row?.itemTotal) || 0;
  if (totalItems > 0 && covered >= totalItems) return 'success';
  if (covered > 0) return 'warning';
  return 'info';
};

/** 查询工作台列表 */
const getList = async () => {
  loading.value = true;
  const res = await listInvoiceWorkbench(queryParams.value);
  workbenchList.value = res.data?.rows ?? [];
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

/** 直接打开发票匹配台（带申请上下文，不再跳转发票台账页） */
const goInvoicePage = (row: any) => {
  matchRequestId.value = row.requestId;
  matchVisible.value = true;
};

/** 人工标记 / 取消标记完成 */
const handleToggleDone = async (row: any, done: boolean) => {
  const label = row.requestCode || row.requestTitle || '';
  await proxy?.$modal.confirm(done ? `确认申请「${label}」的发票已全部上传并登记完成吗？` : `确认取消申请「${label}」的完成标记吗？`);
  await updateInvoiceWorkbenchDoneFlag({ requestId: row.requestId, done });
  proxy?.$modal.msgSuccess(done ? '已标记完成' : '已取消完成');
  await getList();
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

onMounted(() => {
  getList();
  loadOptions();
});
</script>
