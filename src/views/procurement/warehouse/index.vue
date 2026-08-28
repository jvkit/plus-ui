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
            <el-form-item label="项目" prop="projectId">
              <el-select v-model="queryParams.projectId" placeholder="请选择项目" clearable style="width: 180px">
                <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
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
            <el-button v-hasPermi="['procurement:warehouse:add']" type="primary" plain icon="Plus" @click="handleAdd">手动入库</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:warehouse:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:warehouse:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:warehouse:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="warehouseList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column label="品名" align="center" prop="itemName" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="规格" align="center" prop="spec" min-width="100" :show-overflow-tooltip="true" />
        <el-table-column label="单位" align="center" prop="unit" width="80" />
        <el-table-column label="可用数量" align="center" prop="qtyAvailable" width="100">
          <template #default="scope">
            <span :class="Number(scope.row.qtyAvailable) <= 0 ? 'text-red-500 font-bold' : ''">{{ Number(scope.row.qtyAvailable) || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="项目" align="center" prop="projectName" :show-overflow-tooltip="true" />
        <el-table-column label="入库日期" align="center" prop="inboundDate" width="110" />
        <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
        <el-table-column label="操作" align="center" width="140" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['procurement:warehouse:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['procurement:warehouse:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 手动入库 / 修改库存对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" append-to-body>
      <el-form ref="warehouseFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="品名" prop="itemName">
              <el-input v-model="form.itemName" placeholder="请输入品名" maxlength="200" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格" prop="spec">
              <el-input v-model="form.spec" placeholder="请输入规格型号" maxlength="200" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="form.unit" allow-create filterable placeholder="选择或输入单位" style="width: 100%">
                <el-option v-for="u in unitOptions" :key="u" :label="u" :value="u" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item :label="form.id !== undefined ? '库存数量' : '入库数量'" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" :precision="4" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目" prop="projectId">
              <el-select v-model="form.projectId" placeholder="请选择项目" clearable filterable style="width: 100%">
                <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="入库日期" prop="inboundDate">
              <el-date-picker v-model="form.inboundDate" value-format="YYYY-MM-DD" type="date" placeholder="选择入库日期" style="width: 100%" />
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

<script setup name="ProcurementWarehouse" lang="ts">
import { listWarehouse, getWarehouse, delWarehouse, addWarehouse, updateWarehouse, exportWarehouse } from '@/api/procurement/warehouse';
import { WarehouseForm, WarehouseQuery, WarehouseVO } from '@/api/procurement/warehouse/types';
import { listProject } from '@/api/procurement/project';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const warehouseList = ref<WarehouseVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const projectOptions = ref<any[]>([]);

const unitOptions = ['个', '台', '套', '盒', '包', '箱', '米', '厘米', '毫米', '千克', '克', '升', '毫升', '根', '张', '卷', '块', '条', '把', '片', '对', '副', '袋', '瓶'];

const queryFormRef = ref<ElFormInstance>();
const warehouseFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: WarehouseForm = {
  id: undefined,
  itemName: '',
  spec: '',
  brand: '',
  unit: '个',
  qtyAvailable: undefined,
  quantity: undefined,
  sourceItemId: undefined,
  projectId: undefined,
  inboundDate: '',
  remark: ''
};

const data = reactive<PageData<WarehouseForm, WarehouseQuery>>({
  form: JSON.parse(JSON.stringify(initFormData)),
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    itemName: '',
    spec: '',
    projectId: undefined
  },
  rules: {
    itemName: [{ required: true, message: '品名不能为空', trigger: 'blur' }],
    spec: [{ required: true, message: '规格不能为空', trigger: 'blur' }],
    quantity: [{ required: true, message: '数量不能为空', trigger: 'blur' }],
    projectId: [{ required: true, message: '项目不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询仓库库存列表 */
const getList = async () => {
  loading.value = true;
  const res = await listWarehouse(queryParams.value);
  warehouseList.value = res.data.rows;
  total.value = res.data.total;
  loading.value = false;
};

/** 加载项目列表 */
const loadOptions = async () => {
  const projectRes = await listProject({ pageNum: 1, pageSize: 1000 } as any);
  projectOptions.value = projectRes.data.rows || [];
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = JSON.parse(JSON.stringify(initFormData));
  warehouseFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: WarehouseVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 手动入库按钮操作 */
const handleAdd = () => {
  reset();
  form.value.inboundDate = proxy?.parseTime(new Date(), '{y}-{m}-{d}') || '';
  dialog.visible = true;
  dialog.title = '手动入库';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: WarehouseVO) => {
  reset();
  const id = row?.id || ids.value[0];
  const res = await getWarehouse(id);
  form.value = { ...JSON.parse(JSON.stringify(initFormData)), ...res.data };
  form.value.quantity = Number(form.value.qtyAvailable) || 0; // 编辑时直接调整可用数量
  dialog.visible = true;
  dialog.title = '修改库存';
};

/** 提交按钮 */
const submitForm = () => {
  warehouseFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    // 手动入库/编辑：数量统一映射到可用数量（qty_available）
    form.value.qtyAvailable = form.value.quantity;
    if (form.value.id !== undefined) {
      await updateWarehouse(form.value);
    } else {
      await addWarehouse(form.value);
    }
    proxy?.$modal.msgSuccess('操作成功');
    dialog.visible = false;
    await getList();
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: WarehouseVO) => {
  const idList = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除品名为"' + idList + '"的库存数据项？');
  await delWarehouse(idList);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('procurement/warehouse/export', queryParams.value, `warehouse_${new Date().getTime()}.xlsx`);
};

onMounted(() => {
  getList();
  loadOptions();
});
</script>

<style scoped>
.font-bold {
  font-weight: bold;
}
</style>
