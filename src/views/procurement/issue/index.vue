<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="领用编号" prop="issueCode">
              <el-input v-model="queryParams.issueCode" placeholder="请输入领用编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="品名" prop="itemName">
              <el-input v-model="queryParams.itemName" placeholder="请输入品名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 120px">
                <el-option label="待审" value="pending" />
                <el-option label="已通过" value="approved" />
                <el-option label="已拒绝" value="rejected" />
                <el-option label="已出库" value="issued" />
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
            <el-button v-hasPermi="['procurement:issue:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:issue:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:issue:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:issue:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="issueList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column label="领用编号" align="center" prop="issueCode" width="170" :show-overflow-tooltip="true" />
        <el-table-column label="品名" align="center" prop="itemName" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="规格" align="center" prop="spec" min-width="100" :show-overflow-tooltip="true" />
        <el-table-column label="领用数量" align="center" prop="qtyRequested" width="90" />
        <el-table-column label="用途" align="center" prop="purpose" min-width="140" :show-overflow-tooltip="true" />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="申请人" align="center" prop="applicant" width="100" />
        <el-table-column label="当前审批人" align="center" prop="currentApprover" width="100">
          <template #default="scope">
            <span>{{ scope.row.currentApprover || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审批人" align="center" prop="approver" width="100" />
        <el-table-column label="审批时间" align="center" prop="approveTime" width="160">
          <template #default="scope">
            <span>{{ scope.row.approveTime ? proxy.parseTime(scope.row.approveTime) : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip v-if="!scope.row.processInstanceId" content="修改" placement="top">
              <el-button v-hasPermi="['procurement:issue:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip v-if="!scope.row.processInstanceId" content="提交" placement="top">
              <el-button v-hasPermi="['procurement:issue:submit']" link type="primary" icon="Promotion" @click="handleSubmit(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip v-if="!scope.row.processInstanceId" content="删除" placement="top">
              <el-button v-hasPermi="['procurement:issue:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 新增/修改领用申请对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="700px" append-to-body>
      <el-form ref="issueFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="库存物料" prop="stockId">
              <el-select v-model="form.stockId" placeholder="请选择库存物料" clearable filterable style="width: 100%" :disabled="form.id !== undefined" @change="onStockChange">
                <el-option v-for="item in stockOptions" :key="item.id" :label="stockLabel(item)" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品名">
              <el-input :model-value="form.itemName" placeholder="选择物料后自动带出" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="规格">
              <el-input :model-value="form.spec" placeholder="选择物料后自动带出" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可用数量">
              <el-input :model-value="String(form.qtyAvailable ?? '')" placeholder="当前库存" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="领用数量" prop="qtyRequested">
              <el-input-number v-model="form.qtyRequested" :min="1" :max="Number(form.qtyAvailable) || undefined" :precision="4" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人" prop="applicant">
              <el-input v-model="form.applicant" placeholder="自动带出当前登录用户" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="用途" prop="purpose">
          <el-input v-model="form.purpose" type="textarea" placeholder="请输入领用用途" maxlength="500" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleSubmitFlow">提 交</el-button>
          <el-button @click="submitForm">保 存</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ProcurementIssue" lang="ts">
import { listIssue, getIssue, delIssue, addIssue, updateIssue, approveIssue, submitIssue, exportIssue } from '@/api/procurement/issue';
import { IssueForm, IssueQuery, IssueVO } from '@/api/procurement/issue/types';
import { listWarehouse } from '@/api/procurement/warehouse';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const issueList = ref<IssueVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const stockOptions = ref<any[]>([]);

const statusOptions = ref([
  { label: '待审', value: 'pending', elTagType: 'info' },
  { label: '已通过', value: 'approved', elTagType: 'success' },
  { label: '已拒绝', value: 'rejected', elTagType: 'danger' },
  { label: '已出库', value: 'issued', elTagType: 'warning' },
  { label: '待审核', value: 'waiting', elTagType: '' },
  { label: '已退回', value: 'back', elTagType: 'danger' }
]);

const queryFormRef = ref<ElFormInstance>();
const issueFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: IssueForm = {
  id: undefined,
  issueCode: '',
  stockId: undefined,
  itemName: '',
  spec: '',
  qtyAvailable: undefined,
  qtyRequested: undefined,
  purpose: '',
  applicant: '',
  approver: '',
  status: 'pending',
  processInstanceId: undefined,
  approveTime: '',
  remark: ''
};

const data = reactive<PageData<IssueForm, IssueQuery>>({
  form: JSON.parse(JSON.stringify(initFormData)),
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    issueCode: '',
    itemName: '',
    status: ''
  },
  rules: {
    stockId: [{ required: true, message: '请选择库存物料', trigger: 'change' }],
    qtyRequested: [{ required: true, message: '领用数量不能为空', trigger: 'blur' }],
    purpose: [{ required: true, message: '用途不能为空', trigger: 'blur' }],
    applicant: [{ required: false }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 库存物料下拉文案：品名 + 规格（剩余可用） */
const stockLabel = (item: any) => {
  return `${item.itemName}${item.spec ? ' / ' + item.spec : ''}（可用 ${Number(item.qtyAvailable) || 0}）`;
};

/** 查询领用申请列表 */
const getList = async () => {
  loading.value = true;
  const res = await listIssue(queryParams.value);
  issueList.value = res.data.rows;
  total.value = res.data.total;
  loading.value = false;
};

/** 加载库存物料列表 */
const loadStockOptions = async () => {
  const res = await listWarehouse({ pageNum: 1, pageSize: 1000 } as any);
  stockOptions.value = res.data.rows || [];
};

/** 选择库存物料：带出品名/规格/可用数量 */
const onStockChange = (val: number | string | undefined) => {
  form.value.itemName = '';
  form.value.spec = '';
  form.value.qtyAvailable = undefined;
  form.value.qtyRequested = undefined;
  if (!val) return;
  const stock = stockOptions.value.find((item) => item.id === val);
  if (stock) {
    form.value.itemName = stock.itemName || '';
    form.value.spec = stock.spec || '';
    form.value.qtyAvailable = Number(stock.qtyAvailable) || 0;
  }
};

/** 是否可编辑（待审/已退回可改/删） */
const isEditable = (status?: string) => {
  return !status || status === 'pending' || status === 'back';
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = JSON.parse(JSON.stringify(initFormData));
  issueFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: IssueVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加领用申请';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: IssueVO) => {
  reset();
  const id = row?.id || ids.value[0];
  const res = await getIssue(id);
  form.value = { ...JSON.parse(JSON.stringify(initFormData)), ...res.data };
  dialog.visible = true;
  dialog.title = '修改领用申请';
};

/** 提交按钮 */
const submitForm = () => {
  issueFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    const requested = Number(form.value.qtyRequested) || 0;
    const available = Number(form.value.qtyAvailable) || 0;
    if (requested > available) {
      proxy?.$modal.msgError('领用数量不能超过可用数量（' + available + '）');
      return;
    }
    form.value.id ? await updateIssue(form.value) : await addIssue(form.value);
    proxy?.$modal.msgSuccess('操作成功');
    dialog.visible = false;
    await getList();
  });
};

/** 提交领用申请（发起流程） */
const handleSubmitFlow = () => {
  issueFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    const requested = Number(form.value.qtyRequested) || 0;
    const available = Number(form.value.qtyAvailable) || 0;
    if (requested > available) {
      proxy?.$modal.msgError('领用数量不能超过可用数量（' + available + '）');
      return;
    }
    await submitIssue(form.value);
    proxy?.$modal.msgSuccess('提交成功，已进入审批流程');
    dialog.visible = false;
    await getList();
  });
};

/** 列表行：提交已有领用申请 */
const handleSubmit = async (row: IssueVO) => {
  const res = await getIssue(row.id);
  const full = { ...JSON.parse(JSON.stringify(initFormData)), ...res.data };
  await proxy?.$modal.confirm('是否确认提交领用申请「' + (row.issueCode || row.id) + '」进入审批流程？');
  await submitIssue(full);
  proxy?.$modal.msgSuccess('提交成功，已进入审批流程');
  await getList();
};

/** 删除按钮操作 */
const handleDelete = async (row?: IssueVO) => {
  const idList = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除领用编号为"' + idList + '"的数据项？');
  await delIssue(idList);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('procurement/issue/export', queryParams.value, `issue_${new Date().getTime()}.xlsx`);
};

onMounted(() => {
  getList();
  loadStockOptions();
});
</script>
