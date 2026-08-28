<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="报销编号" prop="reimbursementCode">
              <el-input v-model="queryParams.reimbursementCode" placeholder="请输入报销编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="申请人" prop="applicant">
              <el-input v-model="queryParams.applicant" placeholder="请输入申请人" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['procurement:reimbursement:add']" type="primary" plain icon="FolderAdd" @click="handlePack">生成报销包</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:reimbursement:export']" type="warning" plain icon="Download" :disabled="single" @click="handleDownload">下载</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="reimbursementList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column label="报销编号" align="center" prop="reimbursementCode" width="170" :show-overflow-tooltip="true" />
        <el-table-column label="关联申请" align="center" prop="requestCode" width="160" :show-overflow-tooltip="true" />
        <el-table-column label="项目" align="center" prop="projectName" :show-overflow-tooltip="true" />
        <el-table-column label="申请人" align="center" prop="applicant" width="110" />
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="打包文件" align="center" width="100">
          <template #default="scope">
            <el-link v-if="scope.row.fileUrl" type="primary" :underline="false" @click="openFile(scope.row.fileUrl)">查看</el-link>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
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

    <!-- 生成报销包对话框 -->
    <el-dialog v-model="packDialog.visible" title="生成报销包" width="640px" append-to-body>
      <el-form ref="packFormRef" :model="packForm" :rules="packRules" label-width="100px">
        <el-form-item label="关联申请" prop="requestId">
          <el-select v-model="packForm.requestId" placeholder="请选择已验收完成的采购申请" filterable clearable style="width: 100%" @change="onRequestChange">
            <el-option v-for="item in acceptedRequests" :key="item.id" :label="item.requestCode + '（' + item.title + '）'" :value="item.id" />
          </el-select>
          <div class="text-xs text-gray-400">仅可选择已验收完成的采购申请进行报销打包</div>
        </el-form-item>
        <el-form-item label="项目">
          <el-input :model-value="packForm.projectName" placeholder="选择申请后自动带出" disabled />
        </el-form-item>
        <el-form-item label="申请人">
          <el-input :model-value="packForm.applicant" placeholder="选择申请后自动带出" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitPack">打 包</el-button>
          <el-button @click="packDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detail.visible" title="报销包详情" width="720px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="报销编号">{{ detail.data?.reimbursementCode }}</el-descriptions-item>
        <el-descriptions-item label="关联申请">{{ detail.data?.requestCode }}</el-descriptions-item>
        <el-descriptions-item label="项目">{{ detail.data?.projectName }}</el-descriptions-item>
        <el-descriptions-item label="申请人">{{ detail.data?.applicant }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="statusOptions" :value="detail.data?.status" />
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ proxy.parseTime(detail.data?.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="打包文件">
          <el-link v-if="detail.data?.fileUrl" type="primary" :underline="false" @click="openFile(detail.data?.fileUrl)">打开打包文件</el-link>
          <span v-else class="text-gray-400">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="包含内容" :span="2">{{ contentText }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" plain @click="detail.visible = false">关 闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ProcurementReimbursement" lang="ts">
import { listReimbursement, getReimbursement, addReimbursement, acceptedRequestList } from '@/api/procurement/reimbursement';
import { ReimbursementForm, ReimbursementQuery, ReimbursementVO } from '@/api/procurement/reimbursement/types';
import { getRequest } from '@/api/procurement/request';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const reimbursementList = ref<ReimbursementVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const total = ref(0);
const acceptedRequests = ref<any[]>([]);

const statusOptions = ref([
  { label: '打包中', value: 'packing', elTagType: 'warning' },
  { label: '已打包', value: 'packed', elTagType: 'success' },
  { label: '已发送', value: 'sent', elTagType: 'primary' }
]);

const queryFormRef = ref<ElFormInstance>();
const packFormRef = ref<ElFormInstance>();
const packDialog = reactive<DialogOption>({ visible: false, title: '生成报销包' });
const detail = reactive<{ visible: boolean; data: ReimbursementVO | null }>({
  visible: false,
  data: null
});

const initPackForm = {
  requestId: undefined as number | string | undefined,
  acceptanceId: undefined as number | string | undefined,
  projectId: undefined as number | string | undefined,
  projectName: '',
  applicant: ''
};

const packForm = reactive<{
  requestId: number | string | undefined;
  acceptanceId: number | string | undefined;
  projectId: number | string | undefined;
  projectName: string;
  applicant: string;
}>({ ...initPackForm });

const packRules = {
  requestId: [{ required: true, message: '请选择已验收完成的采购申请', trigger: 'change' }]
};

const queryParams = reactive<ReimbursementQuery>({
  pageNum: 1,
  pageSize: 10,
  reimbursementCode: '',
  requestId: undefined,
  projectId: undefined,
  applicant: '',
  status: ''
});

/** 详情包含内容（JSON 美化展示） */
const contentText = computed(() => {
  const raw = detail.data?.contentJson;
  if (!raw) return '-';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
});

/** 查询报销导出列表 */
const getList = async () => {
  loading.value = true;
  const res = await listReimbursement(queryParams);
  reimbursementList.value = res.data.rows;
  total.value = res.data.total;
  loading.value = false;
};

/** 加载已验收完成的申请列表 */
const loadAcceptedRequests = async () => {
  const res = await acceptedRequestList();
  acceptedRequests.value = res.data || [];
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

/** 多选框选中数据 */
const handleSelectionChange = (selection: ReimbursementVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
};

/** 打开生成报销包对话框 */
const handlePack = () => {
  packForm.requestId = undefined;
  packForm.acceptanceId = undefined;
  packForm.projectId = undefined;
  packForm.projectName = '';
  packForm.applicant = '';
  packDialog.visible = true;
};

/** 选择申请后带出项目/申请人 */
const onRequestChange = async (val: number | string | undefined) => {
  if (!val) {
    packForm.acceptanceId = undefined;
    packForm.projectId = undefined;
    packForm.projectName = '';
    packForm.applicant = '';
    return;
  }
  const res = await getRequest(val);
  const req = res.data;
  packForm.projectId = req.projectId;
  packForm.projectName = req.projectName || '';
  packForm.applicant = req.leader || '';
  packForm.acceptanceId = (req as any).acceptanceId;
};

/** 打包 */
const submitPack = () => {
  packFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    const payload = {
      requestId: packForm.requestId,
      acceptanceId: packForm.acceptanceId,
      projectId: packForm.projectId,
      applicant: packForm.applicant,
      status: 'packing'
    } as ReimbursementForm;
    await addReimbursement(payload);
    proxy?.$modal.msgSuccess('报销包生成成功');
    packDialog.visible = false;
    await getList();
  });
};

/** 详情按钮操作 */
const handleDetail = async (row: ReimbursementVO) => {
  const res = await getReimbursement(row.id);
  detail.data = res.data;
  detail.visible = true;
};

/** 打开附件/文件链接 */
const openFile = (url?: string) => {
  if (url) {
    window.open(url, '_blank');
  }
};

/** 下载按钮操作：下载选中的报销包文件 */
const handleDownload = async () => {
  const id = ids.value[0];
  if (!id) {
    proxy?.$modal.msgError('请先选择一条报销记录');
    return;
  }
  const row = reimbursementList.value.find((item) => item.id === id);
  const fileName = `报销包_${row?.reimbursementCode || id}.zip`;
  proxy?.download('procurement/reimbursement/download/' + id, {}, fileName);
};

onMounted(() => {
  getList();
  loadAcceptedRequests();
});
</script>
