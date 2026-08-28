<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="项目编码" prop="projectCode" v-if="false">
              <el-input v-model="queryParams.projectCode" placeholder="请输入项目编码" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="项目名称" prop="projectName">
              <el-input v-model="queryParams.projectName" placeholder="请输入项目名称" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="项目负责人" prop="leader">
              <el-input v-model="queryParams.leader" placeholder="请输入项目负责人" clearable @keyup.enter="handleQuery" />
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
            <el-button v-hasPermi="['procurement:project:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:project:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:project:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:project:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="info" plain icon="Sort" @click="handleToggleExpandAll">展开/折叠</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table ref="treeTableRef" v-loading="loading" border :data="projectList" row-key="id" :tree-props="{ children: 'children', hasChildren: 'hasChildren' }" :default-expand-all="isExpandAll" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column v-if="false" label="项目编码" align="center" prop="projectCode" :show-overflow-tooltip="true" />
        <el-table-column label="项目名称" align="center" prop="projectName" :show-overflow-tooltip="true" />
        <el-table-column label="归属部门" align="center" prop="deptName" width="140" />
        <el-table-column label="项目负责人" align="center" prop="leader" />
        <el-table-column label="项目预算" align="center" prop="budget" width="120">
          <template #default="scope">
            <span>{{ (Number(scope.row.budget) || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已用金额" align="center" prop="usedAmount" width="120">
          <template #default="scope">
            <span>{{ (Number(scope.row.usedAmount) || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="剩余资金" align="center" width="120">
          <template #default="scope">
            <span :class="remainingOf(scope.row) < 0 ? 'text-red-500 font-bold' : ''">{{ remainingOf(scope.row).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="开始日期" align="center" prop="startDate" width="120" />
        <el-table-column label="结束日期" align="center" prop="endDate" width="120" />
        <el-table-column label="状态" align="center" prop="status" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">{{ scope.row.status === 1 ? '正常' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="190" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="新增子项目" placement="top">
              <el-button v-hasPermi="['procurement:project:add']" link type="primary" icon="CirclePlusFilled" @click="handleAddSub(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button v-hasPermi="['procurement:project:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button v-hasPermi="['procurement:project:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加或修改项目对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="700px" append-to-body>
      <el-form ref="projectFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="项目名称" prop="projectName">
              <el-input v-model="form.projectName" placeholder="请输入项目名称" maxlength="200" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归属部门" prop="deptId">
              <el-tree-select v-model="form.deptId" :data="deptTree" :props="deptTreeProps" check-strictly clearable placeholder="选择归属部门" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="项目负责人" prop="leader">
              <el-select v-model="form.leaderId" filterable clearable placeholder="选择负责人（真实用户）" style="width: 100%" @change="onLeaderChange">
                <el-option v-for="u in userOptions" :key="u.userId" :label="u.nickName" :value="u.userId" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="项目预算" prop="budget">
              <el-input-number v-model="form.budget" :precision="2" :min="0" controls-position="right" style="width: 100%" />
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
        <el-row>
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker v-model="form.startDate" value-format="YYYY-MM-DD" type="date" placeholder="选择开始日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker v-model="form.endDate" value-format="YYYY-MM-DD" type="date" placeholder="选择结束日期" style="width: 100%" />
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

<script setup name="ProcurementProject" lang="ts">
import { listProject, getProject, delProject, addProject, updateProject } from '@/api/procurement/project';
import { ProjectForm, ProjectQuery, ProjectVO } from '@/api/procurement/project/types';
import { listUser } from '@/api/system/user';
import type { UserVO } from '@/api/system/user/types';
import { listDept } from '@/api/system/dept';
import { useTreeTableExpand } from '@/hooks/tree/useTreeTableExpand';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const projectList = ref<ProjectVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref<ElFormInstance>();
const projectFormRef = ref<ElFormInstance>();
const treeTableRef = ref<ElTableInstance>();
const { isExpandAll, handleToggleExpandAll } = useTreeTableExpand<ProjectVO>({
  tableRef: treeTableRef,
  data: projectList
});
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ProjectForm = {
  id: undefined,
  parentId: 0,
  projectCode: '',
  projectName: '',
  deptId: undefined,
  leader: '',
  leaderId: undefined,
  budget: undefined,
  startDate: '',
  endDate: '',
  status: 1,
  remark: ''
};

const data = reactive<PageData<ProjectForm, ProjectQuery>>({
  form: { ...initFormData },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    projectCode: '',
    projectName: '',
    leader: '',
    status: undefined
  },
  rules: {
    projectName: [{ required: true, message: '项目名称不能为空', trigger: 'blur' }],
    status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询采购项目列表 */
const getList = async () => {
  loading.value = true;
  const res = await listProject({ ...queryParams.value, pageNum: 1, pageSize: 99999 });
  projectList.value = proxy?.handleTree(res.data.rows, 'id', 'parentId', 'children') || [];
  total.value = res.data.total;
  loading.value = false;
};

/** 计算剩余资金 = 预算 - 已用 */
const remainingOf = (row: ProjectVO) => {
  return (Number(row.budget) || 0) - (Number(row.usedAmount) || 0);
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = { ...initFormData };
  projectFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: ProjectVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  form.value.parentId = 0;
  dialog.visible = true;
  dialog.title = '添加项目';
};

/** 新增子项目 */
const handleAddSub = (row: ProjectVO) => {
  reset();
  form.value.parentId = row.id;
  dialog.visible = true;
  dialog.title = '添加子项目 - ' + row.projectName;
};

/** 修改按钮操作 */
const handleUpdate = async (row?: ProjectVO) => {
  reset();
  const id = row?.id || ids.value[0];
  const res = await getProject(id);
  Object.assign(form.value, res.data);
  dialog.visible = true;
  dialog.title = '修改项目';
};

/** 提交按钮 */
const submitForm = () => {
  projectFormRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      form.value.id ? await updateProject(form.value) : await addProject(form.value);
      proxy?.$modal.msgSuccess('操作成功');
      dialog.visible = false;
      await getList();
    }
  });
};

/** 删除按钮操作 */
const handleDelete = async (row?: ProjectVO) => {
  const idList = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除项目编号为"' + idList + '"的数据项？');
  await delProject(idList);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('procurement/project/export', queryParams.value, `project_${new Date().getTime()}.xlsx`);
};

const userOptions = ref<UserVO[]>([]);
const deptTree = ref<any[]>([]);
const deptTreeProps = { value: 'deptId', label: 'deptName', children: 'children' } as any;

/** 加载用户列表（负责人选择器） */
const loadUserOptions = async () => {
  const res = await listUser({ pageNum: 1, pageSize: 1000 } as any);
  userOptions.value = res.data.rows || [];
};

/** 加载部门树（归属部门选择器） */
const loadDeptOptions = async () => {
  const res = await listDept({} as any);
  deptTree.value = proxy?.handleTree(res.data, 'deptId', 'parentId', 'children') || [];
};

/** 负责人选中后回写姓名 */
const onLeaderChange = (userId: number | string) => {
  const u = userOptions.value.find((x) => x.userId === userId);
  form.value.leader = u ? u.nickName : '';
};

onMounted(() => {
  getList();
  loadUserOptions();
  loadDeptOptions();
});
</script>

<style lang="scss" scoped>
/* 树形层级缩进由 el-table 的 tree-props 原生支持，无需额外样式 */
</style>
