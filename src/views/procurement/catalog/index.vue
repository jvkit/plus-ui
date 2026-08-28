<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="品名" prop="itemName">
              <el-input v-model="queryParams.itemName" placeholder="请输入品名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="规格" prop="spec">
              <el-input v-model="queryParams.spec" placeholder="请输入规格" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="queryParams.brand" placeholder="请输入品牌" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="分类" prop="category">
              <el-select v-model="queryParams.category" placeholder="分类" clearable style="width: 120px">
                <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="库存关联" prop="stockId">
              <el-input v-model="queryParams.stockId" placeholder="仓库库存(模糊)" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 120px">
                <el-option label="正常" :value="1" />
                <el-option label="停用" :value="0" />
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
            <el-button v-hasPermi="['procurement:catalog:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:catalog:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:catalog:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:catalog:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="catalogList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column label="品名" align="center" prop="itemName" min-width="140" :show-overflow-tooltip="true" />
        <el-table-column label="规格" align="center" prop="spec" min-width="100" :show-overflow-tooltip="true" />
        <el-table-column label="品牌" align="center" prop="brand" min-width="90" :show-overflow-tooltip="true" />
        <el-table-column label="单位" align="center" prop="unit" width="70" />
        <el-table-column label="参考单价" align="center" prop="refPrice" width="110">
          <template #default="scope">
            <span>{{ (Number(scope.row.refPrice) || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分类" align="center" prop="category" width="90">
          <template #default="scope">
            <el-tag :type="categoryTag(scope.row.category)" size="small">{{ scope.row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联项目" align="center" prop="projectName" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">{{ scope.row.status === 1 ? '正常' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="130" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['procurement:catalog:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['procurement:catalog:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改BOM物料对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="700px" append-to-body>
      <el-form ref="catalogFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="品名" prop="itemName">
              <el-input v-model="form.itemName" placeholder="请输入品名" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格" prop="spec">
              <el-input v-model="form.spec" placeholder="请输入规格" maxlength="100" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="品牌" prop="brand">
              <el-input v-model="form.brand" placeholder="请输入品牌" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="form.unit" placeholder="请选择单位" clearable style="width: 100%">
                <el-option v-for="u in unitOptions" :key="u" :label="u" :value="u" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="参考单价" prop="refPrice">
              <el-input-number v-model="form.refPrice" :precision="2" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%">
                <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="关联项目" prop="projectId">
              <el-tree-select
                v-model="form.projectId"
                :data="projectTree"
                :props="treeProps"
                check-strictly
                clearable
                placeholder="请选择项目(可空)"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存关联" prop="stockId">
              <el-input v-model="form.stockId" placeholder="关联仓库库存(可空)" maxlength="50" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="产品链接" prop="link">
              <el-input v-model="form.link" placeholder="请输入产品链接(可空)" maxlength="500" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">正常</el-radio>
                <el-radio :value="0">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ProcurementCatalog" lang="ts">
import { listCatalog, getCatalog, delCatalog, addCatalog, updateCatalog } from '@/api/procurement/catalog';
import { CatalogForm, CatalogQuery, CatalogVO } from '@/api/procurement/catalog/types';
import { treeProject } from '@/api/procurement/project';
import { ProjectVO } from '@/api/procurement/project/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const catalogList = ref<CatalogVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const projectTree = ref<ProjectVO[]>([]);

const categoryOptions = ['材料', '设备', '其他'];
const unitOptions = ['个', '台', '套', '盒', '包', '箱', '米', '厘米', '毫米', '千克', '克', '升', '毫升', '根', '张', '卷', '块', '条', '把', '片', '对', '副', '袋', '瓶'];

/** 项目树选择器 props */
const treeProps = { value: 'id', label: 'projectName', children: 'children' } as any;

const queryFormRef = ref<ElFormInstance>();
const catalogFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: CatalogForm = {
  id: undefined,
  itemName: '',
  spec: '',
  brand: '',
  unit: '个',
  refPrice: undefined,
  category: '材料',
  link: '',
  projectId: undefined,
  stockId: undefined,
  status: 1,
  remark: ''
};

const data = reactive<PageData<CatalogForm, CatalogQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemName: '',
    spec: '',
    brand: '',
    category: '',
    projectId: undefined,
    stockId: '',
    status: undefined
  },
  rules: {
    itemName: [{ required: true, message: '品名不能为空', trigger: 'blur' }],
    category: [{ required: true, message: '分类不能为空', trigger: 'change' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 分类标签颜色 */
const categoryTag = (category?: string): 'primary' | 'success' | 'info' | '' => {
  if (category === '材料') return 'primary';
  if (category === '设备') return 'success';
  if (category === '其他') return 'info';
  return '';
};

/** 查询BOM物料库列表 */
const getList = async () => {
  loading.value = true;
  const res = await listCatalog(queryParams.value);
  catalogList.value = res.data?.rows || [];
  total.value = res.data?.total || 0;
  loading.value = false;
};

/** 加载项目树选项 */
const loadOptions = async () => {
  const projectRes = await treeProject();
  projectTree.value = projectRes.data || [];
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  catalogFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: CatalogVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加BOM物料';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: CatalogVO) => {
  reset();
  const id = row?.id || ids.value[0];
  const res = await getCatalog(id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改BOM物料';
};

/** 提交按钮 */
const submitForm = () => {
  catalogFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.id ? await updateCatalog(form.value) : await addCatalog(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: CatalogVO) => {
  const idList = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除品名为"' + (row?.itemName || idList) + '"的物料数据项？');
  await delCatalog(idList);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('procurement/catalog/export', queryParams.value, `catalog_${new Date().getTime()}.xlsx`);
};

onMounted(() => {
  getList();
  loadOptions();
});
</script>
