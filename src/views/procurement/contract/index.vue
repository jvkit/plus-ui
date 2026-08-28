<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="合同编号" prop="contractNo">
              <el-input v-model="queryParams.contractNo" placeholder="请输入合同编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="合同标题" prop="title">
              <el-input v-model="queryParams.title" placeholder="请输入合同标题" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 120px">
                <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
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
            <el-button v-hasPermi="['procurement:contract:add']" type="primary" plain icon="DocumentAdd" @click="handleGenerate">生成合同</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:contract:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="contractList">
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column label="合同编号" align="center" prop="contractNo" width="170" :show-overflow-tooltip="true" />
        <el-table-column label="合同标题" align="center" prop="title" :show-overflow-tooltip="true" />
        <el-table-column label="关联申请" align="center" prop="requestCode" width="160" :show-overflow-tooltip="true" />
        <el-table-column label="合同总金额" align="center" prop="amount" width="120">
          <template #default="scope">
            <span>{{ (Number(scope.row.amount) || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="生成时间" align="center" prop="generateTime" width="180">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.generateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="合同文件" align="center" width="100">
          <template #default="scope">
            <el-link v-if="scope.row.fileUrl" type="primary" :underline="false" @click="openFile(scope.row.fileUrl)">查看</el-link>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="90" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button link type="primary" icon="View" @click="handleDetail(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 生成合同对话框 -->
    <el-dialog v-model="genDialog.visible" title="生成合同" width="860px" append-to-body>
      <el-form ref="genFormRef" :model="genForm" :rules="genRules" label-width="100px">
        <el-form-item label="关联申请" prop="requestId">
          <el-select v-model="genForm.requestId" placeholder="请选择对公采购申请" filterable clearable style="width: 100%" @change="onRequestChange">
            <el-option v-for="item in companyRequests" :key="item.id" :label="item.requestCode + '（' + item.title + '）'" :value="item.id" />
          </el-select>
          <div class="text-xs text-gray-400">仅可选择"对公"采购申请生成合同</div>
        </el-form-item>
        <el-form-item label="合同标题">
          <el-input :model-value="genForm.title" placeholder="选择申请后自动带出" disabled />
        </el-form-item>
        <el-form-item label="合同总金额">
          <el-input :model-value="genForm.amount ? genForm.amount.toFixed(2) : ''" placeholder="选择申请后自动带出" disabled />
        </el-form-item>
        <el-form-item label="开票信息" v-if="genForm.invoiceInfo">
          <el-descriptions :column="2" border size="small" class="w-full">
            <el-descriptions-item label="开票抬头">{{ genForm.invoiceInfo.title }}</el-descriptions-item>
            <el-descriptions-item label="税号">{{ genForm.invoiceInfo.taxNo }}</el-descriptions-item>
            <el-descriptions-item label="地址电话">{{ genForm.invoiceInfo.addressPhone }}</el-descriptions-item>
            <el-descriptions-item label="开户行账号">{{ genForm.invoiceInfo.bankAccount }}</el-descriptions-item>
          </el-descriptions>
        </el-form-item>
        <el-form-item label="物料明细">
          <el-table :data="genForm.items" border size="small" class="w-full">
            <el-table-column label="品名" align="center" prop="itemName" min-width="120" :show-overflow-tooltip="true" />
            <el-table-column label="规格" align="center" prop="spec" min-width="100" :show-overflow-tooltip="true" />
            <el-table-column label="品牌" align="center" prop="brand" min-width="90" :show-overflow-tooltip="true" />
            <el-table-column label="单位" align="center" prop="unit" width="70" />
            <el-table-column label="数量" align="center" prop="quantity" width="80" />
            <el-table-column label="单价" align="center" prop="unitPrice" width="90" />
            <el-table-column label="金额" align="center" width="100">
              <template #default="scope"><span>{{ (Number(scope.row.amount) || 0).toFixed(2) }}</span></template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitGenerate">生 成</el-button>
          <el-button @click="genDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 合同详情对话框 -->
    <el-dialog v-model="detail.visible" title="合同详情" width="900px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="合同编号">{{ detail.data?.contractNo }}</el-descriptions-item>
        <el-descriptions-item label="关联申请">{{ detail.data?.requestCode }}</el-descriptions-item>
        <el-descriptions-item label="合同标题" :span="2">{{ detail.data?.title }}</el-descriptions-item>
        <el-descriptions-item label="合同总金额">{{ (Number(detail.data?.amount) || 0).toFixed(2) }} 元</el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="statusOptions" :value="detail.data?.status" />
        </el-descriptions-item>
        <el-descriptions-item label="生成时间">{{ proxy.parseTime(detail.data?.generateTime) }}</el-descriptions-item>
        <el-descriptions-item label="合同文件">
          <el-link v-if="detail.data?.fileUrl" type="primary" :underline="false" @click="openFile(detail.data?.fileUrl)">打开合同文件</el-link>
          <span v-else class="text-gray-400">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="报价单">
          <el-link v-if="detail.data?.quotationUrl" type="primary" :underline="false" @click="openFile(detail.data?.quotationUrl)">打开报价单</el-link>
          <span v-else class="text-gray-400">-</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-form-item label="合同内容" class="mt-3">
        <el-input :model-value="detail.data?.content" type="textarea" :rows="12" readonly />
      </el-form-item>
      <template #footer>
        <el-button type="primary" plain @click="detail.visible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ProcurementContract" lang="ts">
import { listContract, getContract, addContract, companyRequestList } from '@/api/procurement/contract';
import { ContractForm, ContractQuery, ContractVO } from '@/api/procurement/contract/types';
import { getRequest } from '@/api/procurement/request';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const contractList = ref<ContractVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const companyRequests = ref<any[]>([]);

const statusOptions = ref([
  { label: '草稿', value: 'draft', elTagType: 'info' },
  { label: '已生成', value: 'generated', elTagType: 'success' },
  { label: '已发送', value: 'sent', elTagType: 'primary' }
]);

const queryFormRef = ref<ElFormInstance>();
const genFormRef = ref<ElFormInstance>();
const genDialog = reactive<DialogOption>({ visible: false, title: '生成合同' });
const detail = reactive<{ visible: boolean; data: ContractVO | null }>({
  visible: false,
  data: null
});

const initGenForm = {
  requestId: undefined as number | string | undefined,
  title: '',
  amount: 0,
  invoiceInfo: null as any,
  items: [] as any[],
  quotationUrl: ''
};

const genForm = reactive<{
  requestId: number | string | undefined;
  title: string;
  amount: number;
  invoiceInfo: any;
  items: any[];
  quotationUrl: string;
}>({ ...initGenForm });

const genRules = {
  requestId: [{ required: true, message: '请选择对公采购申请', trigger: 'change' }]
};

const queryParams = reactive<ContractQuery>({
  pageNum: 1,
  pageSize: 10,
  contractNo: '',
  title: '',
  status: ''
});

/** 查询采购合同列表 */
const getList = async () => {
  loading.value = true;
  const res = await listContract(queryParams);
  contractList.value = res.data.rows;
  total.value = res.data.total;
  loading.value = false;
};

/** 加载可生成合同的对公申请列表 */
const loadCompanyRequests = async () => {
  const res = await companyRequestList();
  companyRequests.value = res.data || [];
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 打开生成合同对话框 */
const handleGenerate = () => {
  genForm.requestId = undefined;
  genForm.title = '';
  genForm.amount = 0;
  genForm.invoiceInfo = null;
  genForm.items = [];
  genForm.quotationUrl = '';
  genDialog.visible = true;
};

/** 选择申请后带出标题/开票信息/明细/金额 */
const onRequestChange = async (val: number | string | undefined) => {
  if (!val) {
    genForm.title = '';
    genForm.amount = 0;
    genForm.invoiceInfo = null;
    genForm.items = [];
    genForm.quotationUrl = '';
    return;
  }
  const res = await getRequest(val);
  const req = res.data;
  genForm.title = req.title || '';
  genForm.amount = Number(req.amount) || 0;
  genForm.invoiceInfo = req.invoiceInfo || null;
  genForm.items = req.items || [];
  genForm.quotationUrl = req.quotationUrl || '';
};

/** 生成合同 */
const submitGenerate = () => {
  genFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (!genForm.title) {
      proxy?.$modal.msgError('所选申请缺少标题，无法生成合同');
      return;
    }
    const payload = {
      requestId: genForm.requestId,
      title: genForm.title,
      invoiceInfoJson: genForm.invoiceInfo ? JSON.stringify(genForm.invoiceInfo) : '',
      itemsJson: JSON.stringify(genForm.items || []),
      amount: genForm.amount,
      quotationUrl: genForm.quotationUrl
    } as ContractForm;
    await addContract(payload);
    proxy?.$modal.msgSuccess('合同生成成功');
    genDialog.visible = false;
    await getList();
  });
};

/** 详情按钮操作 */
const handleDetail = async (row: ContractVO) => {
  const res = await getContract(row.id);
  detail.data = res.data;
  detail.visible = true;
};

/** 打开附件/文件链接 */
const openFile = (url?: string) => {
  if (url) {
    window.open(url, '_blank');
  }
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('procurement/contract/export', queryParams, `contract_${new Date().getTime()}.xlsx`);
};

onMounted(() => {
  getList();
  loadCompanyRequests();
});
</script>
