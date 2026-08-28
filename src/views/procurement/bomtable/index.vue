<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="产品名称" prop="name">
              <el-input v-model="queryParams.name" placeholder="请输入产品名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="规格型号" prop="spec">
              <el-input v-model="queryParams.spec" placeholder="请输入规格型号" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['procurement:bomtable:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:bomtable:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:bomtable:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:bomtable:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="bomTableList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column label="产品名称" align="center" prop="name" min-width="160" :show-overflow-tooltip="true" />
        <el-table-column label="规格型号" align="center" prop="spec" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="关联项目" align="center" prop="projectName" min-width="140" :show-overflow-tooltip="true" />
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
        <el-table-column label="操作" align="center" width="190" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="结构" placement="top">
              <el-button v-hasPermi="['procurement:bomtable:query']" link type="primary" icon="Share" @click="openStructure(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['procurement:bomtable:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['procurement:bomtable:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改BOM产品对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="650px" append-to-body>
      <el-form ref="bomTableFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="产品名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入产品名称" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格型号" prop="spec">
              <el-input v-model="form.spec" placeholder="请输入规格型号(可空)" maxlength="100" />
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

    <!-- BOM结构对话框：el-tree 查看/编辑节点 -->
    <el-dialog v-model="structureDialog.visible" :title="structureDialog.title" width="760px" append-to-body destroy-on-close>
      <div class="mb-[10px] flex items-center justify-between">
        <span class="text-gray-400 text-xs">节点语义：分组(group) / 物料(item) / 引用产品(product)，可在节点上新增子节点或删除</span>
        <el-button v-hasPermi="['procurement:bomtable:add']" type="primary" plain icon="Plus" @click="openNodeDialog(null)">新增顶层节点</el-button>
      </div>
      <el-tree
        v-loading="nodeLoading"
        :data="nodeTree"
        node-key="id"
        :props="{ children: 'children' } as any"
        default-expand-all
        :expand-on-click-node="false"
        empty-text="暂无节点，请点击右上角新增"
      >
        <template #default="{ data }">
          <div class="bom-node-row">
            <el-tag size="small" :type="nodeTypeTag(data.nodeType)">{{ nodeTypeLabel(data.nodeType) }}</el-tag>
            <span class="bom-node-label">{{ nodeLabelOf(data) }}</span>
            <span class="bom-node-actions">
              <el-tooltip content="新增子节点" placement="top">
                <el-button v-hasPermi="['procurement:bomtable:add']" link type="primary" icon="Plus" @click="openNodeDialog(data)"></el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button v-hasPermi="['procurement:bomtable:remove']" link type="primary" icon="Delete" @click="handleDeleteNode(data)"></el-button>
              </el-tooltip>
            </span>
          </div>
        </template>
      </el-tree>
      <template #footer>
        <el-button @click="structureDialog.visible = false">关 闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增BOM节点对话框 -->
    <el-dialog v-model="nodeDialog.visible" :title="nodeDialog.title" width="700px" append-to-body>
      <el-form ref="nodeFormRef" :model="nodeForm" label-width="100px">
        <el-form-item label="节点类型" prop="nodeType">
          <el-radio-group v-model="nodeForm.nodeType" @change="onNodeTypeChange">
            <el-radio value="group">分组</el-radio>
            <el-radio value="item">物料</el-radio>
            <el-radio value="product">引用产品</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="nodeForm.nodeType === 'group'" label="分组名称" prop="groupName">
          <el-input v-model="nodeForm.groupName" placeholder="请输入分组名称，如：结构件" maxlength="100" />
        </el-form-item>
        <template v-if="nodeForm.nodeType === 'item'">
          <el-form-item label="物料" prop="catalogId">
            <el-select v-model="nodeForm.catalogId" placeholder="请选择BOM库物料" filterable clearable style="width: 100%" @change="onCatalogChange">
              <el-option v-for="c in catalogList" :key="c.id" :label="c.itemName + (c.spec ? ' ' + c.spec : '')" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-row>
            <el-col :span="12">
              <el-form-item label="品名">
                <el-input v-model="nodeForm.itemName" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="规格">
                <el-input v-model="nodeForm.spec" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="品牌">
                <el-input v-model="nodeForm.brand" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单位">
                <el-input v-model="nodeForm.unit" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item label="单套用量" prop="qtyPerUnit">
                <el-input-number v-model="nodeForm.qtyPerUnit" :min="0" :precision="4" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="参考单价">
                <el-input-number v-model="nodeForm.refPrice" :min="0" :precision="2" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
        <el-form-item v-if="nodeForm.nodeType === 'product'" label="引用产品" prop="refBomTableId">
          <el-select v-model="nodeForm.refBomTableId" placeholder="请选择引用的BOM产品" filterable clearable style="width: 100%">
            <el-option v-for="b in bomTableOptions" :key="b.id" :label="b.name + (b.spec ? ' ' + b.spec : '')" :value="b.id" />
          </el-select>
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="排序" prop="sortNo">
              <el-input-number v-model="nodeForm.sortNo" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="nodeForm.remark" type="textarea" placeholder="请输入备注" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitNodeForm">确 定</el-button>
          <el-button @click="nodeDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ProcurementBomTable" lang="ts">
import { listBomTable, getBomTable, delBomTable, addBomTable, updateBomTable, listBomNode, addBomNode, delBomNode } from '@/api/procurement/bomtable';
import { BomNodeForm, BomNodeVO, BomTableForm, BomTableQuery, BomTableVO } from '@/api/procurement/bomtable/types';
import { listCatalog } from '@/api/procurement/catalog';
import { CatalogVO } from '@/api/procurement/catalog/types';
import { treeProject } from '@/api/procurement/project';
import { ProjectVO } from '@/api/procurement/project/types';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const bomTableList = ref<BomTableVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const projectTree = ref<ProjectVO[]>([]);
/** BOM库物料选项（item节点选择） */
const catalogList = ref<CatalogVO[]>([]);
/** 产品选项（product节点选择） */
const bomTableOptions = ref<BomTableVO[]>([]);

/** 项目树选择器 props */
const treeProps = { value: 'id', label: 'projectName', children: 'children' } as any;

const queryFormRef = ref<ElFormInstance>();
const bomTableFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: BomTableForm = {
  id: undefined,
  name: '',
  spec: '',
  projectId: undefined,
  status: 1,
  remark: ''
};

const data = reactive<PageData<BomTableForm, BomTableQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    name: '',
    spec: '',
    projectId: undefined,
    status: undefined
  },
  rules: {
    name: [{ required: true, message: '产品名称不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询BOM产品列表 */
const getList = async () => {
  loading.value = true;
  const res = await listBomTable(queryParams.value);
  bomTableList.value = res.data?.rows || [];
  total.value = res.data?.total || 0;
  loading.value = false;
};

/** 加载项目树/物料库/产品选项 */
const loadOptions = async () => {
  const [projectRes, catalogRes, tableRes] = await Promise.all([
    treeProject(),
    listCatalog({ pageNum: 1, pageSize: 99999 } as any),
    listBomTable({ pageNum: 1, pageSize: 99999 } as any)
  ]);
  projectTree.value = projectRes.data || [];
  catalogList.value = catalogRes.data?.rows || [];
  bomTableOptions.value = tableRes.data?.rows || [];
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  bomTableFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: BomTableVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  dialog.visible = true;
  dialog.title = '添加BOM产品';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: BomTableVO) => {
  reset();
  const id = row?.id || ids.value[0];
  const res = await getBomTable(id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改BOM产品';
};

/** 提交按钮 */
const submitForm = () => {
  bomTableFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.id ? await updateBomTable(form.value) : await addBomTable(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: BomTableVO) => {
  const idList = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除产品"' + (row?.name || idList) + '"的数据项？');
  await delBomTable(idList);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('procurement/bomtable/export', queryParams.value, `bomtable_${new Date().getTime()}.xlsx`);
};

/* ================= BOM 节点（结构） ================= */

/** 结构弹窗状态 */
const structureDialog = reactive<DialogOption>({ visible: false, title: '' });
/** 当前查看结构的BOM产品 */
const currentNodeTable = ref<BomTableVO | null>(null);
const nodeTree = ref<BomNodeVO[]>([]);
const nodeLoading = ref(false);
/** 节点新增弹窗状态 */
const nodeDialog = reactive<DialogOption>({ visible: false, title: '' });
const nodeFormRef = ref<ElFormInstance>();

const initNodeFormData: BomNodeForm = {
  id: undefined,
  bomTableId: undefined,
  parentId: 0,
  nodeType: 'group',
  groupName: '',
  catalogId: undefined,
  itemName: '',
  spec: '',
  brand: '',
  unit: '',
  qtyPerUnit: undefined,
  refPrice: undefined,
  stockQty: undefined,
  refBomTableId: undefined,
  sortNo: undefined,
  remark: ''
};
const nodeForm = ref<BomNodeForm>({ ...initNodeFormData });

/** 节点类型中文名 */
const nodeTypeLabel = (t?: string): string => (t === 'group' ? '分组' : t === 'item' ? '物料' : t === 'product' ? '引用产品' : '-');
/** 节点类型标签颜色 */
const nodeTypeTag = (t?: string): 'primary' | 'success' | 'warning' | 'info' => (t === 'group' ? 'primary' : t === 'item' ? 'success' : t === 'product' ? 'warning' : 'info');

/** 树节点显示文案 */
const nodeLabelOf = (data: BomNodeVO): string => {
  if (data.nodeType === 'group') return data.groupName || '未命名分组';
  if (data.nodeType === 'item') {
    const name = data.itemName || '物料';
    const spec = data.spec ? ' ' + data.spec : '';
    const qty = data.qtyPerUnit ? ` ×${data.qtyPerUnit}${data.unit || ''}` : '';
    const stock = data.stockQty !== undefined && data.stockQty !== null ? `（库存${data.stockQty}）` : '';
    return name + spec + qty + stock;
  }
  if (data.nodeType === 'product') {
    const name = data.refBomTableName || '引用产品';
    const qty = data.qtyPerUnit ? ` ×${data.qtyPerUnit}` : '';
    return name + qty;
  }
  return '';
};

/** 加载BOM节点树（后端平铺列表 -> 前端组树） */
const loadNodeTree = async () => {
  if (!currentNodeTable.value) return;
  nodeLoading.value = true;
  const res = await listBomNode(currentNodeTable.value.id);
  const list = (res.data as any)?.rows || res.data || [];
  nodeTree.value = proxy?.handleTree(list, 'id', 'parentId', 'children') || [];
  nodeLoading.value = false;
};

/** 打开结构弹窗 */
const openStructure = async (row: BomTableVO) => {
  currentNodeTable.value = row;
  structureDialog.title = `BOM结构 - ${row.name}`;
  structureDialog.visible = true;
  await loadNodeTree();
};

/** 打开新增节点弹窗（parent为null表示顶层） */
const openNodeDialog = (parent: BomNodeVO | null) => {
  nodeForm.value = {
    ...initNodeFormData,
    bomTableId: currentNodeTable.value?.id,
    parentId: parent?.id || 0,
    nodeType: parent ? 'item' : 'group'
  };
  nodeDialog.title = parent ? `新增子节点（父：${nodeLabelOf(parent)}）` : '新增顶层节点';
  nodeDialog.visible = true;
};

/** 切换节点类型：清空类型相关字段 */
const onNodeTypeChange = () => {
  nodeForm.value.groupName = '';
  nodeForm.value.catalogId = undefined;
  nodeForm.value.itemName = '';
  nodeForm.value.spec = '';
  nodeForm.value.brand = '';
  nodeForm.value.unit = '';
  nodeForm.value.qtyPerUnit = undefined;
  nodeForm.value.refPrice = undefined;
  nodeForm.value.refBomTableId = undefined;
};

/** 选择物料：从BOM库带出品名/规格/品牌/单位/参考单价（只读） */
const onCatalogChange = (id?: number | string) => {
  const c = catalogList.value.find((x) => x.id === id);
  nodeForm.value.itemName = c?.itemName || '';
  nodeForm.value.spec = c?.spec || '';
  nodeForm.value.brand = c?.brand || '';
  nodeForm.value.unit = c?.unit || '';
  nodeForm.value.refPrice = c?.refPrice;
};

/** 节点业务校验（按类型） */
const validateNode = (): boolean => {
  const f = nodeForm.value;
  if (f.nodeType === 'group' && !f.groupName) {
    proxy?.$modal.msgError('请输入分组名称');
    return false;
  }
  if (f.nodeType === 'item' && !f.catalogId) {
    proxy?.$modal.msgError('请选择BOM库物料');
    return false;
  }
  if (f.nodeType === 'product' && !f.refBomTableId) {
    proxy?.$modal.msgError('请选择引用产品');
    return false;
  }
  return true;
};

/** 提交新增节点 */
const submitNodeForm = async () => {
  if (!validateNode()) return;
  await addBomNode(nodeForm.value);
  proxy?.$modal.msgSuccess('新增成功');
  nodeDialog.visible = false;
  await loadNodeTree();
};

/** 删除节点 */
const handleDeleteNode = async (node: BomNodeVO) => {
  const label = nodeLabelOf(node);
  await proxy?.$modal.confirm('是否确认删除BOM节点"' + (label || node.id) + '"？');
  await delBomNode(node.id);
  await loadNodeTree();
  proxy?.$modal.msgSuccess('删除成功');
};

onMounted(() => {
  getList();
  loadOptions();
});
</script>

<style scoped>
.bom-node-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding-right: 8px;
}
.bom-node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bom-node-actions {
  display: inline-flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.bom-node-row:hover .bom-node-actions {
  opacity: 1;
}
</style>
