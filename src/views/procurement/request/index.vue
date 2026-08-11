<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="申请编号" prop="requestCode">
              <el-input v-model="queryParams.requestCode" placeholder="请输入申请编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="标题" prop="title">
              <el-input v-model="queryParams.title" placeholder="请输入标题" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="项目" prop="projectId">
              <el-select v-model="queryParams.projectId" placeholder="请选择项目" clearable style="width: 180px">
                <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="供应商" prop="supplierId">
              <el-select v-model="queryParams.supplierId" placeholder="请选择供应商" clearable style="width: 180px">
                <el-option v-for="item in supplierOptions" :key="item.id" :label="item.supplierName" :value="item.id" />
              </el-select>
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
            <el-form-item label="采购类型" prop="purchaseType">
              <el-select v-model="queryParams.purchaseType" placeholder="采购类型" clearable style="width: 140px">
                <el-option label="设备" value="equipment" />
                <el-option label="材料" value="material" />
                <el-option label="服务" value="service" />
                <el-option label="工程" value="engineering" />
                <el-option label="危化品" value="dangerous" />
                <el-option label="其他" value="other" />
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
        <el-table-column label="申请编号" align="center" prop="requestCode" width="170" :show-overflow-tooltip="true" />
        <el-table-column label="标题" align="center" prop="title" :show-overflow-tooltip="true" />
        <el-table-column label="项目" align="center" prop="projectName" :show-overflow-tooltip="true" />
        <el-table-column label="供应商" align="center" prop="supplierName" :show-overflow-tooltip="true" />
        <el-table-column label="总金额" align="center" prop="amount" width="120">
          <template #default="scope">
            <span>{{ (Number(scope.row.amount) || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="采购类型" align="center" prop="purchaseType" width="100">
          <template #default="scope">
            <dict-tag :options="purchaseTypeOptions" :value="scope.row.purchaseType" />
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="220" class-name="small-padding fixed-width">
          <template #default="scope">
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
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="900px" append-to-body>
      <el-form ref="requestFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="申请标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入申请标题" maxlength="200" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目" prop="projectId">
              <el-select v-model="form.projectId" placeholder="请选择项目" clearable style="width: 100%">
                <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplierId">
              <el-select v-model="form.supplierId" placeholder="请选择供应商" clearable style="width: 100%">
                <el-option v-for="item in supplierOptions" :key="item.id" :label="item.supplierName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采购类型" prop="purchaseType">
              <el-select v-model="form.purchaseType" placeholder="请选择采购类型" clearable style="width: 100%">
                <el-option label="设备" value="equipment" />
                <el-option label="材料" value="material" />
                <el-option label="服务" value="service" />
                <el-option label="工程" value="engineering" />
                <el-option label="危化品" value="dangerous" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="申请原因" prop="applyReason">
          <el-input v-model="form.applyReason" type="textarea" placeholder="请输入申请原因" maxlength="1000" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" maxlength="500" />
        </el-form-item>
      </el-form>

      <el-card shadow="never" class="mt-2">
        <template #header>
          <div class="card-header">
            <span>采购明细</span>
            <el-button v-hasPermi="['procurement:request:add']" type="primary" link icon="Plus" @click="openItemDialog()">添加明细</el-button>
          </div>
        </template>
        <el-table :data="form.items" border size="small">
          <el-table-column label="采购种类" align="center" prop="purchaseType" width="90" />
          <el-table-column label="品名" align="center" prop="itemName" min-width="130" :show-overflow-tooltip="true" />
          <el-table-column label="规格" align="center" prop="spec" min-width="90" :show-overflow-tooltip="true" />
          <el-table-column label="单位" align="center" prop="unit" width="70" />
          <el-table-column label="数量" align="center" prop="quantity" width="80" />
          <el-table-column label="单价" align="center" prop="unitPrice" width="90" />
          <el-table-column label="金额" align="center" width="100">
            <template #default="scope"><span>{{ (scope.row.amount || 0).toFixed(2) }}</span></template>
          </el-table-column>
          <el-table-column label="平台" align="center" prop="platform" width="80" />
          <el-table-column label="供应商" align="center" min-width="110" :show-overflow-tooltip="true">
            <template #default="scope">{{ supplierNameOf(scope.row.supplierId) }}</template>
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
      <el-dialog v-model="itemDialog.visible" :title="itemDialog.title" width="680px" append-to-body>
        <el-form ref="itemFormRef" :model="itemForm" label-width="100px">
          <el-row>
            <el-col :span="12">
              <el-form-item label="采购种类" prop="purchaseType">
                <el-select v-model="itemForm.purchaseType" style="width: 100%">
                  <el-option label="科研类" value="科研类" />
                  <el-option label="非科研类" value="非科研类" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="一级分类" prop="category1">
                <el-input v-model="itemForm.category1" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="二级分类" prop="category2">
                <el-input v-model="itemForm.category2" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="项目归属" prop="projectBelong">
                <el-input v-model="itemForm.projectBelong" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="品名" prop="itemName">
                <el-input v-model="itemForm.itemName" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位" prop="unit">
                <el-select v-model="itemForm.unit" allow-create filterable placeholder="选择或输入单位" style="width: 100%">
                  <el-option v-for="u in unitOptions" :key="u" :label="u" :value="u" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="数量" prop="quantity">
                <el-input-number v-model="itemForm.quantity" :min="0" :precision="4" :controls="false" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单价" prop="unitPrice">
                <el-input-number v-model="itemForm.unitPrice" :min="0" :precision="4" :controls="false" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="规格" prop="spec"><el-input v-model="itemForm.spec" /></el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="品牌" prop="brand"><el-input v-model="itemForm.brand" /></el-form-item>
            </el-col>
          </el-row>
          <!-- 自动识别相关放靠后 -->
          <el-form-item label="链接" prop="link">
            <el-input v-model="itemForm.link" placeholder="商品链接/标题" @blur="onItemLinkBlur" />
          </el-form-item>
          <el-row>
            <el-col :span="12">
              <el-form-item label="平台" prop="platform">
                <el-input v-model="itemForm.platform" placeholder="自动识别" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="供应商" prop="supplierId">
                <el-select v-model="itemForm.supplierId" clearable filterable placeholder="选供应商(可选)" style="width: 100%">
                  <el-option v-for="s in filterSuppliers(itemForm.platform)" :key="s.id" :label="s.supplierName" :value="s.id" />
                </el-select>
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
  </div>
</template>

<script setup name="ProcurementRequest" lang="ts">
import { listRequest, getRequest, delRequest, addRequest, updateRequest, submitRequest } from '@/api/procurement/request';
import { RequestForm, RequestQuery, RequestVO, RequestItemForm } from '@/api/procurement/request/types';
import { listProject } from '@/api/procurement/project';
import { ProjectVO } from '@/api/procurement/project/types';
import { listSupplier } from '@/api/procurement/supplier';
import { SupplierVO } from '@/api/procurement/supplier/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const requestList = ref<RequestVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const projectOptions = ref<ProjectVO[]>([]);
const supplierOptions = ref<SupplierVO[]>([]);

const statusOptions = ref([
  { label: '草稿', value: 'draft', elTagType: 'info' },
  { label: '待审核', value: 'waiting', elTagType: '' },
  { label: '已完成', value: 'finish', elTagType: 'success' },
  { label: '已退回', value: 'back', elTagType: 'danger' },
  { label: '已撤销', value: 'cancel', elTagType: 'warning' },
  { label: '已作废', value: 'invalid', elTagType: 'danger' },
  { label: '已终止', value: 'termination', elTagType: 'danger' }
]);

const purchaseTypeOptions = ref([
  { label: '物资', value: 'goods', elTagType: 'primary' },
  { label: '服务', value: 'service', elTagType: 'success' },
  { label: '固定资产', value: 'fixed_asset', elTagType: 'warning' }
]);

const queryFormRef = ref<ElFormInstance>();
const requestFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const emptyItem = (): RequestItemForm => ({
  id: undefined,
  requestId: undefined,
  purchaseType: '科研类',
  category1: '100材料',
  category2: '112科研类低值易耗品',
  projectBelong: '李迪科学家工作室',
  itemName: '',
  spec: '',
  brand: '',
  unit: '个',
  quantity: undefined,
  unitPrice: undefined,
  amount: 0,
  bomItemId: undefined,
  sortNo: undefined,
  link: '',
  platform: '',
  supplierId: undefined,
  remark: ''
});

const initFormData: RequestForm = {
  id: undefined,
  requestCode: '',
  title: '',
  projectId: undefined,
  supplierId: undefined,
  amount: 0,
  purchaseType: '',
  applyReason: '',
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
    supplierId: undefined,
    status: '',
    purchaseType: ''
  },
  rules: {
    projectId: [{ required: true, message: '项目不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

const totalAmount = computed(() => {
  if (!form.value.items) return 0;
  return form.value.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
});

/** 查询采购申请列表 */
const getList = async () => {
  loading.value = true;
  const res = await listRequest(queryParams.value);
  requestList.value = res.data.rows;
  total.value = res.data.total;
  loading.value = false;
};

/** 加载项目/供应商下拉 */
const loadOptions = async () => {
  const [projectRes, supplierRes] = await Promise.all([
    listProject({ pageNum: 1, pageSize: 1000 } as any),
    listSupplier({ pageNum: 1, pageSize: 1000 } as any)
  ]);
  projectOptions.value = projectRes.data.rows || [];
  supplierOptions.value = supplierRes.data.rows || [];
};

/** 是否可编辑 */
const isEditable = (status?: string) => {
  return !status || status === 'draft' || status === 'back' || status === 'cancel';
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
  form.value = { ...JSON.parse(JSON.stringify(initFormData)), ...res.data, items: res.data.items || [] };
  dialog.visible = true;
  dialog.title = '修改采购申请';
};

/** 添加明细行 */
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
  } else {
    itemForm.value = { ...form.value.items[index] };
    editingItemIndex.value = index;
    itemDialog.title = '编辑明细';
  }
  itemDialog.visible = true;
};

/** 链接失焦自动识别平台 */
const onItemLinkBlur = () => {
  if (itemForm.value.link) {
    itemForm.value.platform = detectPlatform(itemForm.value.link);
  }
};

/** 确认明细：keepOpen=true 表示"再添加一个" */
const confirmItem = (keepOpen: boolean) => {
  const qty = Number(itemForm.value.quantity) || 0;
  const price = Number(itemForm.value.unitPrice) || 0;
  itemForm.value.amount = Number((qty * price).toFixed(2));
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

/** 计算单行金额 */
const calcItem = (index: number) => {
  const item = form.value.items[index];
  const qty = Number(item.quantity) || 0;
  const price = Number(item.unitPrice) || 0;
  item.amount = Number((qty * price).toFixed(2));
};

/** 从链接/标题识别平台（平台视为供应商） */
const detectPlatform = (text: string) => {
  if (!text) return '';
  const t = String(text).toLowerCase();
  if (t.includes('tmall.com')) return '天猫';
  if (t.includes('taobao.com')) return '淘宝';
  if (t.includes('jd.com')) return '京东';
  if (t.includes('pinduoduo.com') || t.includes('yangkeduo.com')) return '拼多多';
  if (t.includes('1688.com')) return '1688';
  if (t.includes('douyin.com')) return '抖音';
  if (t.includes('淘宝') || t.includes('-tm')) return '淘宝';
  if (t.includes('天猫')) return '天猫';
  if (t.includes('京东') || t.includes('-jd')) return '京东';
  if (t.includes('拼多多')) return '拼多多';
  if (t.includes('1688')) return '1688';
  if (t.includes('抖音')) return '抖音';
  return '其他';
};

/** 链接失焦自动识别平台 */
const onLinkBlur = (index: number) => {
  const item = form.value.items[index];
  if (item.link) {
    item.platform = detectPlatform(item.link);
  }
};

/** 明细供应商下拉：按平台过滤（平台为空/其他则全显示） */
const filterSuppliers = (platform?: string) => {
  if (!platform || platform === '其他') return supplierOptions.value;
  return supplierOptions.value.filter((s) => !s.platform || s.platform === platform);
};

/** 供应商 id → 名称（展示用） */
const supplierNameOf = (id?: number | string) => {
  if (!id) return '';
  const s = supplierOptions.value.find((x) => x.id === id);
  return s ? s.supplierName : '';
};

/** 保存草稿 */
const submitDraft = () => {
  requestFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (!form.value.items || form.value.items.length === 0) {
      proxy?.$modal.msgError('请至少添加一条采购明细');
      return;
    }
    form.value.id ? await updateRequest(form.value) : await addRequest(form.value);
    proxy?.$modal.msgSuccess('保存成功');
    dialog.visible = false;
    await getList();
  });
};

/** 提交申请并启动流程 */
const submitFlow = () => {
  requestFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (!form.value.items || form.value.items.length === 0) {
      proxy?.$modal.msgError('请至少添加一条采购明细');
      return;
    }
    await submitRequest(form.value);
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
  const detail = await getRequest(row.id);
  await submitRequest(detail.data);
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
  proxy?.download(`procurement/request/exportForm/${row.id}`, {}, `采购申请表_${row.requestCode || row.id}.xlsx`);
};

onMounted(() => {
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
