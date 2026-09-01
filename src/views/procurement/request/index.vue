<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="申请编号" prop="requestCode" v-if="false">
              <el-input v-model="queryParams.requestCode" placeholder="请输入申请编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="标题" prop="titleName">
              <el-input v-model="queryParams.titleName" placeholder="请输入标题" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="项目" prop="projectId">
              <el-tree-select
                v-model="queryParams.projectId"
                :data="projectTree"
                :props="treeProps"
                check-strictly
                clearable
                placeholder="请选择项目"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 120px">
                <el-option label="草稿" value="draft" />
                <el-option label="待审核" value="waiting" />
                <el-option label="已完成" value="finish" />
                <el-option label="已退回" value="back" />
                <el-option label="已撤销" value="cancel" />
                <el-option label="已作废" value="invalid" />
                <el-option label="已终止" value="termination" />
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
            <el-button v-hasPermi="['procurement:request:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:request:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:request:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:request:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="requestList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column v-if="false" label="申请编号" align="center" prop="requestCode" width="170" :show-overflow-tooltip="true" />
        <el-table-column label="标题" align="center" prop="titleName" :show-overflow-tooltip="true" />
        <el-table-column label="项目" align="center" prop="projectName" :show-overflow-tooltip="true" />
        <el-table-column label="项目负责人" align="center" prop="leader" width="100" />
        <el-table-column label="当前审批人" align="center" prop="currentApprover" width="110" :show-overflow-tooltip="true" />
        <el-table-column label="总金额" align="center" prop="amount" width="110">
          <template #default="scope">
            <span>{{ (Number(scope.row.amount) || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="采购方式" align="center" prop="titleType" width="90" />
        <el-table-column label="状态" align="center" prop="status" width="90">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="验收标志" align="center" prop="acceptanceStatus" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.acceptanceStatus === 'done'" type="success">已完成验收</el-tag>
            <el-tag v-else-if="scope.row.acceptanceStatus === 'processing'" type="warning">验收中</el-tag>
            <el-tag v-else type="info">未验收</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="170">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="260" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button v-hasPermi="['procurement:request:query']" link type="primary" icon="View" @click="handleDetail(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['procurement:request:edit']" link type="primary" icon="Edit" :disabled="!isEditable(scope.row.status)" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="提交" placement="top">
              <el-button v-hasPermi="['procurement:request:submit']" link type="primary" icon="Top" :disabled="!isSubmittable(scope.row.status)" @click="handleSubmit(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['procurement:request:remove']" link type="primary" icon="Delete" :disabled="!isEditable(scope.row.status)" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="导出申请表" placement="top">
              <el-button v-hasPermi="['procurement:request:export']" link type="warning" icon="Download" @click="handleExportForm(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改采购申请对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="920px" append-to-body>
      <el-form ref="requestFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="采购方式" prop="titleType">
              <el-radio-group v-model="form.titleType">
                <el-radio value="自购">自购</el-radio>
                <el-radio value="对公">对公</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标题名称" prop="titleName">
              <el-input v-model="form.titleName" placeholder="如：笔记本购买" maxlength="100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="项目" prop="projectId">
              <el-tree-select
                v-model="form.projectId"
                :data="projectTree"
                :props="treeProps"
                check-strictly
                clearable
                placeholder="请选择项目"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采购种类" prop="purchaseType">
              <el-select v-model="form.purchaseType" placeholder="请选择采购种类（整个订单一致）" style="width: 100%">
                <el-option label="科研类" value="科研类" />
                <el-option label="非科研类" value="非科研类" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="项目负责人">
              <el-input :model-value="form.leader" placeholder="选项目后自动带出" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="remainingBudget !== null">
          <el-alert :type="overBudget ? 'error' : 'info'" :closable="false" show-icon>
            <template #title>
              <span>
                所选项目剩余资金：<b>{{ remainingBudget.toFixed(2) }}</b> 元；本单合计：
                <b :class="overBudget ? 'text-red-600' : ''">{{ totalAmount.toFixed(2) }}</b> 元
                <span v-if="overBudget">（超出预算，提交将被拒绝）</span>
              </span>
            </template>
          </el-alert>
        </el-form-item>
        <el-form-item label="申请原因" prop="applyReason">
          <el-input v-model="form.applyReason" type="textarea" placeholder="请输入申请原因" maxlength="1000" />
        </el-form-item>

        <!-- 自购：付款截图 -->
        <el-form-item v-if="form.titleType === '自购'" label="付款截图" prop="paymentScreenshot">
          <ImageUpload v-model="form.paymentScreenshot" :limit="1" />
          <div class="text-xs text-gray-400">自购（淘宝/京东/美团等）需上传实际付款截图</div>
        </el-form-item>

        <!-- 对公：报价单 + 开票信息 -->
        <template v-if="form.titleType === '对公'">
          <el-form-item label="报价单" prop="quotationUrl">
            <FileUpload v-model="form.quotationUrl" :limit="1" :file-type="['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg']" />
          </el-form-item>
          <el-row>
            <el-col :span="12">
              <el-form-item label="开票抬头" prop="invoiceInfo.title">
                <el-input v-model="form.invoiceInfo.title" placeholder="开票抬头" maxlength="200" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="税号" prop="invoiceInfo.taxNo">
                <el-input v-model="form.invoiceInfo.taxNo" placeholder="税号" maxlength="50" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="地址电话" prop="invoiceInfo.addressPhone">
                <el-input v-model="form.invoiceInfo.addressPhone" placeholder="地址电话" maxlength="200" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开户行账号" prop="invoiceInfo.bankAccount">
                <el-input v-model="form.invoiceInfo.bankAccount" placeholder="开户行账号" maxlength="200" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" maxlength="500" />
        </el-form-item>
      </el-form>

      <el-card shadow="never" class="mt-2">
        <template #header>
          <div class="card-header">
            <span>采购明细</span>
            <el-button type="primary" link icon="Plus" @click="openItemDialog()">添加明细</el-button>
          </div>
        </template>
        <el-table :data="form.items" border size="small">
          <el-table-column label="分类" align="center" min-width="150" :show-overflow-tooltip="true">
            <template #default="scope">{{ scope.row.category1 }} / {{ scope.row.category2 }}</template>
          </el-table-column>
          <el-table-column label="品名" align="center" prop="itemName" min-width="120" :show-overflow-tooltip="true" />
          <el-table-column label="规格" align="center" prop="spec" min-width="90" :show-overflow-tooltip="true" />
          <el-table-column label="单位" align="center" prop="unit" width="70" />
          <el-table-column label="数量" align="center" prop="quantity" width="80" />
          <el-table-column label="单价" align="center" prop="unitPrice" width="90" />
          <el-table-column label="金额" align="center" width="100">
            <template #default="scope"><span>{{ (Number(scope.row.amount) || 0).toFixed(2) }}</span></template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="100">
            <template #default="scope">
              <el-button link type="primary" icon="Edit" @click="openItemDialog(scope.$index)"></el-button>
              <el-button link type="danger" icon="Delete" @click="removeItemRow(scope.$index)"></el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="mt-2 text-right font-bold">合计：{{ totalAmount.toFixed(2) }} 元</div>
      </el-card>

      <!-- 明细编辑弹窗 -->
      <el-dialog v-model="itemDialog.visible" :title="itemDialog.title" width="640px" append-to-body>
        <el-form ref="itemFormRef" :model="itemForm" label-width="100px">
          <el-row>
            <el-col :span="12">
              <el-form-item label="分类" prop="category2">
                <el-tree-select
                  v-model="categorySelected"
                  :data="categoryTree"
                  :props="categoryTreeProps"
                  check-strictly
                  clearable
                  placeholder="请选择分类"
                  style="width: 100%"
                  @change="onCategoryChange"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="品名" prop="itemName">
                <el-input v-model="itemForm.itemName" placeholder="品名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="规格" prop="spec"><el-input v-model="itemForm.spec" placeholder="规格型号" /></el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="单位" prop="unit">
                <el-select v-model="itemForm.unit" allow-create filterable placeholder="选择或输入单位" style="width: 100%">
                  <el-option v-for="u in unitOptions" :key="u" :label="u" :value="u" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="数量" prop="quantity">
                <el-input-number v-model="itemForm.quantity" :min="0" :precision="4" :controls="false" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="单价" prop="unitPrice">
                <el-input-number v-model="itemForm.unitPrice" :min="0" :precision="4" :controls="false" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="商品链接" prop="link">
                <el-input v-model="itemForm.link" placeholder="商品链接/标题（一阶段纯手填，二阶段扒价）" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="itemForm.remark" type="textarea" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="itemDialog.visible = false">取 消</el-button>
          <el-button type="primary" plain @click="confirmItem(true)">再添加一个</el-button>
          <el-button type="primary" @click="confirmItem(false)">确 定</el-button>
        </template>
      </el-dialog>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" plain @click="submitDraft">保 存 草 稿</el-button>
          <el-button type="success" @click="submitFlow">提 交 申 请</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detail.visible" title="采购申请详情" width="900px" append-to-body>
      <el-descriptions :column="3" border>
        <el-descriptions-item v-if="false" label="申请编号">{{ detail.data?.requestCode }}</el-descriptions-item>
        <el-descriptions-item label="标题" :span="2">{{ detail.data?.titleName }}</el-descriptions-item>
        <el-descriptions-item label="项目">{{ detail.data?.projectName }}</el-descriptions-item>
        <el-descriptions-item label="项目负责人">{{ detail.data?.leader }}</el-descriptions-item>
        <el-descriptions-item label="当前审批人">{{ detail.data?.currentApprover || '—' }}</el-descriptions-item>
        <el-descriptions-item label="采购方式">{{ detail.data?.titleType }}</el-descriptions-item>
        <el-descriptions-item label="总金额">{{ (Number(detail.data?.amount) || 0).toFixed(2) }} 元</el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :options="statusOptions" :value="detail.data?.status" />
        </el-descriptions-item>
        <el-descriptions-item label="申请原因" :span="3">{{ detail.data?.applyReason }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detail.data?.items || []" border size="small" class="mt-3">
        <el-table-column label="分类" align="center" min-width="150">
          <template #default="scope">{{ scope.row.category1 }} / {{ scope.row.category2 }}</template>
        </el-table-column>
        <el-table-column label="品名" align="center" prop="itemName" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="规格" align="center" prop="spec" min-width="90" :show-overflow-tooltip="true" />
        <el-table-column label="单位" align="center" prop="unit" width="70" />
        <el-table-column label="数量" align="center" prop="quantity" width="80" />
        <el-table-column label="单价" align="center" prop="unitPrice" width="90" />
        <el-table-column label="金额" align="center" width="100">
          <template #default="scope"><span>{{ (Number(scope.row.amount) || 0).toFixed(2) }}</span></template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button type="primary" plain @click="openApprovalRecord">审批记录</el-button>
        <el-button @click="detail.visible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- 审批记录（全局组件，自身为弹窗） -->
    <ApprovalRecord ref="approvalRecordRef" />
  </div>
</template>

<script setup name="ProcurementRequest" lang="ts">
import { listRequest, getRequest, delRequest, addRequest, updateRequest, submitRequest, listCategoryTree } from '@/api/procurement/request';
import { RequestForm, RequestQuery, RequestVO, RequestItemForm } from '@/api/procurement/request/types';
import { treeProject } from '@/api/procurement/project';
import { ProjectVO } from '@/api/procurement/project/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const requestList = ref<RequestVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const projectTree = ref<ProjectVO[]>([]);
const categoryTree = ref<any[]>([]);
const categorySelected = ref<string>('');
const approvalRecordRef = ref();

/** 项目树选择器 props */
/** 项目树选择器 props：label 拼接日期，重名项目也能区分 */
const treeProps = {
  value: 'id',
  label: 'projectName',
  children: 'children'
} as any;
/** 分类树选择器 props：一级节点（有子节点）不可选，仅叶子可选 */
const categoryTreeProps = { value: 'value', label: 'label', children: 'children', disabled: 'disabled' } as any;

const statusOptions = ref([
  { label: '草稿', value: 'draft', elTagType: 'info' },
  { label: '待审核', value: 'waiting', elTagType: '' },
  { label: '已完成', value: 'finish', elTagType: 'success' },
  { label: '已退回', value: 'back', elTagType: 'danger' },
  { label: '已撤销', value: 'cancel', elTagType: 'warning' },
  { label: '已作废', value: 'invalid', elTagType: 'danger' },
  { label: '已终止', value: 'termination', elTagType: 'danger' }
]);

const queryFormRef = ref<ElFormInstance>();
const requestFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const detail = reactive<{ visible: boolean; data: RequestVO | null }>({
  visible: false,
  data: null
});

const emptyItem = (): RequestItemForm => ({
  id: undefined,
  requestId: undefined,
  purchaseType: '科研类',
  category1: '100材料',
  category2: '112科研类低值易耗品',
  itemName: '',
  spec: '',
  brand: '',
  unit: '个',
  quantity: undefined,
  unitPrice: undefined,
  amount: 0,
  link: '',
  sortNo: undefined,
  remark: ''
});

const emptyInvoice = () => ({ title: '', taxNo: '', addressPhone: '', bankAccount: '' });

const initFormData: RequestForm = {
  id: undefined,
  requestCode: '',
  title: '',
  titleType: '自购',
  titleName: '',
  projectId: undefined,
  leader: '',
  procurementContact: '',
  amount: 0,
  purchaseType: '科研类',
  applyReason: '',
  paymentScreenshot: '',
  quotationUrl: '',
  invoiceInfo: emptyInvoice(),
  status: 'draft',
  remark: '',
  items: []
};

const data = reactive<PageData<RequestForm, RequestQuery>>({
  form: JSON.parse(JSON.stringify(initFormData)),
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    requestCode: '',
    title: '',
    projectId: undefined,
    status: '',
    purchaseType: ''
  },
  rules: {
    titleType: [{ required: true, message: '请选择自购/对公', trigger: 'change' }],
    titleName: [{ required: true, message: '请填写标题名称', trigger: 'blur' }],
    projectId: [{ required: true, message: '项目不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const totalAmount = computed(() => {
  if (!form.value.items) return 0;
  return form.value.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

/** 在项目树中递归查找项目 */
const findProject = (nodes: ProjectVO[], id?: number | string): ProjectVO | null => {
  if (!id) return null;
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const r = findProject(n.children, id);
      if (r) return r;
    }
  }
  return null;
};

/** 所选项目剩余资金 */
const remainingBudget = computed(() => {
  const p = findProject(projectTree.value, form.value.projectId);
  if (!p) return null;
  return (Number(p.budget) || 0) - (Number(p.usedAmount) || 0);
});

/** 是否超出预算 */
const overBudget = computed(() => remainingBudget.value !== null && totalAmount.value > remainingBudget.value);

/** 查询采购申请列表 */
const getList = async () => {
  loading.value = true;
  const res = await listRequest(queryParams.value);
  requestList.value = res.data.rows;
  total.value = res.data.total;
  loading.value = false;
};

/** 加载项目树/分类树 */
const loadOptions = async () => {
  const [projectRes, categoryRes] = await Promise.all([treeProject(), listCategoryTree()]);
  projectTree.value = projectRes.data || [];
  categoryTree.value = (categoryRes.data || []).map((n: any) => ({
    ...n,
    disabled: (n.children?.length || 0) > 0
  }));
};

/** 从项目树中递归查找项目名称 */
const projectNameOf = (id?: number | string): string => {
  return findProject(projectTree.value, id)?.projectName || '';
};

/** 自动拼接申请标题：【自购/对公】+项目名+月份月日期日+名称 */
const buildTitle = () => {
  const type = form.value.titleType ? `【${form.value.titleType}】` : '';
  const project = projectNameOf(form.value.projectId);
  const now = new Date();
  const date = `${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日`;
  const name = form.value.titleName || '';
  form.value.title = `${type}${project}_${date}_${name}`;
};

watch(
  () => [form.value.titleType, form.value.titleName, form.value.projectId],
  () => {
    buildTitle();
    // 选项目后自动带出项目负责人
    form.value.leader = findProject(projectTree.value, form.value.projectId)?.leader || '';
  }
);

/** 解析开票信息 JSON 字符串为对象 */
const parseInvoiceInfo = (json?: string) => {
  if (!json) return emptyInvoice();
  try {
    return { ...emptyInvoice(), ...JSON.parse(json) };
  } catch (e) {
    return emptyInvoice();
  }
};

/** 提交前把 invoiceInfo 对象序列化成 invoiceInfoJson 字符串（后端字段名） */
const buildPayload = () => {
  const data: any = { ...form.value, invoiceInfoJson: JSON.stringify(form.value.invoiceInfo || {}) };
  delete data.invoiceInfo;
  return data;
};

/** 是否可编辑：只有草稿状态可编辑 */
const isEditable = (status?: string) => {
  return status === 'draft';
};

/** 是否可提交 */
const isSubmittable = (status?: string) => {
  return !status || status === 'draft' || status === 'back' || status === 'cancel';
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = JSON.parse(JSON.stringify(initFormData));
  requestFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: RequestVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加采购申请';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: RequestVO) => {
  reset();
  const id = row?.id || ids.value[0];
  const res = await getRequest(id);
  const d = res.data || {};
  // 后端存 invoiceInfoJson(字符串)，回显转成 invoiceInfo 对象
  (d as any).invoiceInfo = parseInvoiceInfo(d.invoiceInfoJson);
  form.value = { ...JSON.parse(JSON.stringify(initFormData)), ...d, items: d.items || [] };
  dialog.visible = true;
  dialog.title = '修改采购申请';
};

/** 详情按钮操作 */
const handleDetail = async (row: RequestVO) => {
  const res = await getRequest(row.id);
  detail.data = res.data;
  detail.visible = true;
};

/** 打开审批记录 */
const openApprovalRecord = () => {
  if (detail.data?.id) {
    approvalRecordRef.value?.init(detail.data.id);
  }
};

/** 明细弹窗状态 */
const itemFormRef = ref<ElFormInstance>();
const itemDialog = reactive<DialogOption>({ visible: false, title: '' });
const itemForm = ref<RequestItemForm>(emptyItem());
const editingItemIndex = ref<number | undefined>(undefined);
const unitOptions = ['个', '台', '套', '盒', '包', '箱', '米', '厘米', '毫米', '千克', '克', '升', '毫升', '根', '张', '卷', '块', '条', '把', '片', '对', '副', '袋', '瓶'];

/** 打开明细弹窗(新增或编辑) */
const openItemDialog = (index?: number) => {
  if (index === undefined) {
    itemForm.value = emptyItem();
    editingItemIndex.value = undefined;
    itemDialog.title = '添加明细';
    categorySelected.value = '';
  } else {
    itemForm.value = { ...form.value.items[index] };
    editingItemIndex.value = index;
    itemDialog.title = '编辑明细';
    categorySelected.value = itemForm.value.category2 || itemForm.value.category1 || '';
  }
  itemDialog.visible = true;
};

/** 分类树选中：回写一级分类/二级分类 */
const onCategoryChange = (val: string) => {
  if (!val) {
    itemForm.value.category1 = '';
    itemForm.value.category2 = '';
    return;
  }
  const find = (nodes: any[], parent?: any): any => {
    for (const n of nodes) {
      if (n.value === val) return { node: n, parent };
      if (n.children?.length) {
        const r = find(n.children, n);
        if (r) return r;
      }
    }
    return null;
  };
  const r = find(categoryTree.value);
  if (r) {
    if (r.parent) {
      itemForm.value.category1 = r.parent.value;
      itemForm.value.category2 = r.node.value;
    } else {
      itemForm.value.category1 = r.node.value;
      itemForm.value.category2 = '';
    }
  }
};

/** 确认明细：keepOpen=true 表示"再添加一个" */
const confirmItem = (keepOpen: boolean) => {
  const qty = Number(itemForm.value.quantity) || 0;
  const price = Number(itemForm.value.unitPrice) || 0;
  itemForm.value.amount = Number((qty * price).toFixed(2));
  // 明细采购种类跟随申请级（整个订单一致），导出时明细列使用
  itemForm.value.purchaseType = form.value.purchaseType || '科研类';
  if (editingItemIndex.value === undefined) {
    if (!form.value.items) {
      form.value.items = [];
    }
    form.value.items.push({ ...itemForm.value });
  } else {
    form.value.items[editingItemIndex.value] = { ...itemForm.value };
  }
  if (keepOpen) {
    itemForm.value = emptyItem();
  } else {
    itemDialog.visible = false;
  }
};

/** 删除明细行 */
const removeItemRow = (index: number) => {
  form.value.items.splice(index, 1);
};

/** 表单业务校验：自购需付款截图；对公需报价单+开票信息；至少一条明细 */
const validateBiz = (): boolean => {
  if (!form.value.items || form.value.items.length === 0) {
    proxy?.$modal.msgError('请至少添加一条采购明细');
    return false;
  }
  if (overBudget.value) {
    proxy?.$modal.msgError('超出项目剩余资金，无法提交');
    return false;
  }
  if (form.value.titleType === '自购' && !form.value.paymentScreenshot) {
    proxy?.$modal.msgError('自购需上传付款截图');
    return false;
  }
  if (form.value.titleType === '对公') {
    if (!form.value.quotationUrl) {
      proxy?.$modal.msgError('对公需上传报价单');
      return false;
    }
    const inv = form.value.invoiceInfo;
    if (!inv || !inv.title || !inv.taxNo) {
      proxy?.$modal.msgError('对公需填写开票抬头与税号');
      return false;
    }
  }
  return true;
};

/** 保存草稿 */
const submitDraft = () => {
  requestFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (!form.value.items || form.value.items.length === 0) {
      proxy?.$modal.msgError('请至少添加一条采购明细');
      return;
    }
    const payload = buildPayload();
    form.value.id ? await updateRequest(payload) : await addRequest(payload);
    proxy?.$modal.msgSuccess('保存成功');
    dialog.visible = false;
    await getList();
  });
};

/** 提交申请并启动流程 */
const submitFlow = () => {
  requestFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (!validateBiz()) return;
    await submitRequest(buildPayload());
    proxy?.$modal.msgSuccess('提交成功');
    dialog.visible = false;
    await getList();
  });
};

/** 列表行提交 */
const handleSubmit = async (row: RequestVO) => {
  if (!isSubmittable(row.status)) {
    proxy?.$modal.msgError('当前状态不可提交');
    return;
  }
  await proxy?.$modal.confirm('确认提交申请编号为"' + row.requestCode + '"的采购申请吗？');
  const detailRes = await getRequest(row.id);
  await submitRequest(detailRes.data);
  proxy?.$modal.msgSuccess('提交成功');
  await getList();
};

/** 删除按钮操作 */
const handleDelete = async (row?: RequestVO) => {
  const idList = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除申请编号为"' + idList + '"的数据项？');
  await delRequest(idList);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('procurement/request/export', queryParams.value, `request_${new Date().getTime()}.xlsx`);
};

/** 导出采购申请表 Excel（按模板） */
const handleExportForm = (row: RequestVO) => {
  const fileName = row.title ? row.title + '.xlsx' : `采购申请表_${row.requestCode || row.id}.xlsx`;
  proxy?.download(`procurement/request/exportForm/${row.id}`, {}, fileName);
};

onMounted(() => {
  getList();
  loadOptions();
});
// keep-alive 缓存下切回页面不会重新触发 onMounted，用 onActivated 兜底刷新
// （如新建项目后回到本页需立即看到最新项目树/列表）
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
}
.text-right {
  text-align: right;
}
.font-bold {
  font-weight: bold;
}
</style>
