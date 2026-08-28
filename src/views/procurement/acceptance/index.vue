<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="验收编号" prop="acceptanceCode">
              <el-input v-model="queryParams.acceptanceCode" placeholder="请输入验收编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="关联申请" prop="requestId">
              <el-select v-model="queryParams.requestId" placeholder="请选择采购申请" clearable style="width: 200px">
                <el-option v-for="item in requestOptions" :key="item.id" :label="item.title || item.requestCode" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="项目" prop="projectId">
              <el-select v-model="queryParams.projectId" placeholder="请选择项目" clearable style="width: 180px">
                <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 120px">
                <el-option label="待验收" value="pending" />
                <el-option label="部分验收" value="partial" />
                <el-option label="已完成" value="finished" />
                <el-option label="不合格" value="rejected" />
                <el-option label="待审核" value="waiting" />
                <el-option label="已退回" value="back" />
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
            <el-button v-hasPermi="['procurement:acceptance:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:acceptance:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:acceptance:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:acceptance:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="acceptanceList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column label="验收编号" align="center" prop="acceptanceCode" width="170" :show-overflow-tooltip="true" />
        <el-table-column label="关联申请" align="center" prop="requestTitle" min-width="180" :show-overflow-tooltip="true" />
        <el-table-column label="项目" align="center" prop="projectName" :show-overflow-tooltip="true" />
        <el-table-column label="验收操作人" align="center" prop="operator" width="100" />
        <el-table-column label="验收日期" align="center" width="120">
          <template #default="scope">
            <span>{{ parseTime(scope.row.acceptanceDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="90">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="当前审批人" align="center" prop="currentApprover" width="110" :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ scope.row.currentApprover || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="170">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip v-if="scope.row.status === 'pending' || scope.row.status === 'partial' || scope.row.status === 'back'" content="提交" placement="top">
              <el-button v-hasPermi="['procurement:acceptance:submit']" link type="primary" icon="Promotion" @click="handleSubmit(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['procurement:acceptance:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['procurement:acceptance:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改采购验收对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="1100px" append-to-body>
      <el-form ref="acceptanceFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="关联采购申请" prop="requestId">
              <el-select v-model="form.requestId" placeholder="请选择已审批采购申请" clearable style="width: 100%" :disabled="form.id !== undefined" @change="onRequestChange">
                <el-option v-for="item in requestOptions" :key="item.id" :label="item.title || item.requestCode" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目">
              <el-input :model-value="form.projectName" placeholder="选择采购申请后自动带出" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="验收操作人" prop="operator">
              <el-input v-model="form.operator" placeholder="自动带出当前登录用户" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="验收日期" prop="acceptanceDate">
              <el-date-picker v-model="form.acceptanceDate" value-format="YYYY-MM-DD" type="date" placeholder="选择验收日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" maxlength="500" />
        </el-form-item>
      </el-form>

      <el-card shadow="never" class="mt-2">
        <template #header>
          <div class="card-header">
            <span>验收明细</span>
            <el-alert type="info" :closable="false" show-icon class="inline-alert">
              <template #title>填写发票金额后系统自动核对：不超过申请单价显示「通过」，超出显示「冲红」；实物图片、发票附件每行必填</template>
            </el-alert>
          </div>
        </template>
        <el-table :data="form.items" border size="small">
          <el-table-column label="品名" align="center" prop="itemName" min-width="120" :show-overflow-tooltip="true" />
          <el-table-column label="规格" align="center" prop="spec" min-width="90" :show-overflow-tooltip="true" />
          <el-table-column label="申请单价" align="center" width="100">
            <template #default="scope"><span>{{ (Number(scope.row.applyPrice) || 0).toFixed(2) }}</span></template>
          </el-table-column>
          <el-table-column label="发票金额" align="center" width="130">
            <template #default="scope">
              <el-input-number v-model="scope.row.invoicePrice" :min="0" :precision="2" :controls="false" placeholder="发票金额" style="width: 100%" @change="calcPriceCheck(scope.$index)" />
            </template>
          </el-table-column>
          <el-table-column label="金额核对" align="center" width="90">
            <template #default="scope">
              <el-tag :type="scope.row.priceCheck === 'over' ? 'danger' : 'success'">{{ scope.row.priceCheck === 'over' ? '冲红' : '通过' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="实物图片" align="center" width="140">
            <template #default="scope">
              <ImageUpload v-model="scope.row.photoUrl" :limit="1" />
            </template>
          </el-table-column>
          <el-table-column label="发票附件" align="center" width="140">
            <template #default="scope">
              <FileUpload v-model="scope.row.invoiceUrl" :limit="1" :file-type="['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg']" />
            </template>
          </el-table-column>
          <el-table-column label="备注" align="center" min-width="120">
            <template #default="scope">
              <el-input v-model="scope.row.remark" placeholder="备注" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" plain @click="submitDraft">保 存 草 稿</el-button>
          <el-button type="success" @click="handleSubmitFlow">提 交</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ProcurementAcceptance" lang="ts">
import { listAcceptance, getAcceptance, delAcceptance, addAcceptance, updateAcceptance, exportAcceptance, acceptableRequestList, submitAcceptance } from '@/api/procurement/acceptance';
import { AcceptanceForm, AcceptanceQuery, AcceptanceItemForm, AcceptanceVO } from '@/api/procurement/acceptance/types';
import { getRequest } from '@/api/procurement/request';
import { listProject } from '@/api/procurement/project';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const acceptanceList = ref<AcceptanceVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const requestOptions = ref<any[]>([]);
const projectOptions = ref<any[]>([]);

const statusOptions = ref([
  { label: '待验收', value: 'pending', elTagType: 'info' },
  { label: '部分验收', value: 'partial', elTagType: 'warning' },
  { label: '已完成', value: 'finished', elTagType: 'success' },
  { label: '不合格', value: 'rejected', elTagType: 'danger' },
  { label: '待审核', value: 'waiting', elTagType: '' },
  { label: '已退回', value: 'back', elTagType: 'danger' }
]);

const queryFormRef = ref<ElFormInstance>();
const acceptanceFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const emptyItem = (): AcceptanceItemForm => ({
  id: undefined,
  acceptanceId: undefined,
  sourceItemId: undefined,
  itemName: '',
  spec: '',
  applyPrice: undefined,
  invoicePrice: undefined,
  priceCheck: 'pass',
  photoUrl: '',
  invoiceUrl: '',
  result: 'pass',
  remark: ''
});

const initFormData: AcceptanceForm = {
  id: undefined,
  acceptanceCode: '',
  requestId: undefined,
  projectId: undefined,
  projectName: '',
  operator: '',
  acceptanceDate: '',
  status: 'pending',
  remark: '',
  items: []
};

const data = reactive<PageData<AcceptanceForm, AcceptanceQuery>>({
  form: JSON.parse(JSON.stringify(initFormData)),
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    acceptanceCode: '',
    requestId: undefined,
    projectId: undefined,
    status: ''
  },
  rules: {
    requestId: [{ required: true, message: '请选择关联采购申请', trigger: 'change' }],
    operator: [{ required: false }],
    acceptanceDate: [{ required: true, message: '验收日期不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询采购验收列表 */
const getList = async () => {
  loading.value = true;
  const res = await listAcceptance(queryParams.value);
  acceptanceList.value = res.data.rows;
  total.value = res.data.total;
  loading.value = false;
};

/** 加载可验收申请列表 + 项目列表 */
const loadOptions = async () => {
  const [requestRes, projectRes] = await Promise.all([
    acceptableRequestList(),
    listProject({ pageNum: 1, pageSize: 1000 } as any)
  ]);
  requestOptions.value = requestRes.data || [];
  projectOptions.value = projectRes.data.rows || [];
};

/** 选择采购申请：带出项目与验收明细行 */
const onRequestChange = async (val: number | string | undefined) => {
  form.value.items = [];
  form.value.projectId = undefined;
  form.value.projectName = '';
  if (!val) return;
  const req = requestOptions.value.find((item) => item.id === val);
  if (req) {
    form.value.projectId = req.projectId;
    form.value.projectName = req.projectName || '';
  }
  const res = await getRequest(val);
  const rows: AcceptanceItemForm[] = (res.data.items || []).map((it: any) => ({
    ...emptyItem(),
    sourceItemId: it.id,
    itemName: it.itemName || '',
    spec: it.spec || '',
    applyPrice: Number(it.unitPrice) || 0
  }));
  form.value.items = rows;
};

/** 自动核对：发票金额 <= 申请单价 为通过(pass)，超出为冲红(over) */
const calcPriceCheck = (index: number) => {
  const row = form.value.items[index];
  if (!row) return;
  const invoice = Number(row.invoicePrice) || 0;
  const apply = Number(row.applyPrice) || 0;
  row.priceCheck = invoice > apply ? 'over' : 'pass';
  row.result = row.priceCheck;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = JSON.parse(JSON.stringify(initFormData));
  acceptanceFormRef.value?.resetFields();
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  handleQuery();
};

/** 多选框选中数据 */
const handleSelectionChange = (selection: AcceptanceVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  loadOptions();
  dialog.visible = true;
  dialog.title = '添加采购验收';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: AcceptanceVO) => {
  reset();
  loadOptions();
  const id = row?.id || ids.value[0];
  const res = await getAcceptance(id);
  form.value = { ...JSON.parse(JSON.stringify(initFormData)), ...res.data };
  form.value.items = (res.data.items || []).map((it: any) => ({ ...emptyItem(), ...it }));
  dialog.visible = true;
  dialog.title = '修改采购验收';
};

/** 明细业务校验：每行发票金额、实物图片、发票附件必填 */
const validateItems = (): boolean => {
  if (!form.value.items || form.value.items.length === 0) {
    proxy?.$modal.msgError('请先选择关联采购申请，带出验收明细');
    return false;
  }
  for (let i = 0; i < form.value.items.length; i++) {
    const item = form.value.items[i];
    if (item.invoicePrice === undefined || item.invoicePrice === null) {
      proxy?.$modal.msgError('第 ' + (i + 1) + ' 行：请填写发票金额');
      return false;
    }
    if (!item.photoUrl) {
      proxy?.$modal.msgError('第 ' + (i + 1) + ' 行：请上传实物图片');
      return false;
    }
    if (!item.invoiceUrl) {
      proxy?.$modal.msgError('第 ' + (i + 1) + ' 行：请上传发票附件');
      return false;
    }
  }
  return true;
};

/** 提交验收（发起流程） */
const handleSubmitFlow = () => {
  acceptanceFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (!validateItems()) return;
    await submitAcceptance(form.value);
    proxy?.$modal.msgSuccess('提交成功，已进入审批流程');
    dialog.visible = false;
    await getList();
  });
};

/** 列表行：提交已有验收单（拉取详情后提交，带上明细） */
const handleSubmit = async (row: AcceptanceVO) => {
  const res = await getAcceptance(row.id);
  const full = { ...JSON.parse(JSON.stringify(initFormData)), ...res.data };
  full.items = (res.data.items || []).map((it: any) => ({ ...emptyItem(), ...it }));
  await proxy?.$modal.confirm('是否确认提交验收单「' + (row.acceptanceCode || row.id) + '」进入审批流程？');
  await submitAcceptance(full);
  proxy?.$modal.msgSuccess('提交成功，已进入审批流程');
  await getList();
};

/** 保存草稿（不校验必填，直接存库） */
const submitDraft = async () => {
  form.value.id ? await updateAcceptance(form.value) : await addAcceptance(form.value);
  proxy?.$modal.msgSuccess('保存成功');
  dialog.visible = false;
  await getList();
};

/** 删除按钮操作 */
const handleDelete = async (row?: AcceptanceVO) => {
  const idList = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除验收编号为"' + idList + '"的数据项？');
  await delAcceptance(idList);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('procurement/acceptance/export', queryParams.value, `acceptance_${new Date().getTime()}.xlsx`);
};

onMounted(() => {
  getList();
  loadOptions();
});
// keep-alive 缓存下切回页面重新刷新，避免新建申请/项目后选项过期
onActivated(() => {
  getList();
  loadOptions();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.inline-alert {
  flex: 1;
  max-width: 720px;
}
</style>
