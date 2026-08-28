<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="业务类型" prop="bizType">
              <el-select v-model="queryParams.bizType" placeholder="业务类型" clearable style="width: 130px">
                <el-option v-for="item in bizTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="操作人" prop="operatorName">
              <el-input v-model="queryParams.operatorName" placeholder="请输入操作人姓名" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="操作时间">
              <el-date-picker
                v-model="dateRange"
                value-format="YYYY-MM-DD"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
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
          <el-col :span="20">
            <span class="text-sm text-gray-400">流转记录由系统自动写入，仅支持查询，不可新增/修改/删除</span>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="logList">
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column label="业务类型" align="center" prop="bizType" width="110">
          <template #default="scope">
            <dict-tag :options="bizTypeOptions" :value="scope.row.bizType" />
          </template>
        </el-table-column>
        <el-table-column label="业务ID" align="center" prop="bizId" width="90" />
        <el-table-column label="操作动作" align="center" prop="action" :show-overflow-tooltip="true" />
        <el-table-column label="操作人" align="center" prop="operatorName" width="110" />
        <el-table-column label="状态流转" align="center" width="170">
          <template #default="scope">
            <span class="text-gray-500">{{ scope.row.fromStatus || '-' }}</span>
            <span class="mx-1 text-gray-400">→</span>
            <span class="text-blue-600">{{ scope.row.toStatus || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" align="center" prop="operateTime" width="180">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.operateTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="ProcurementOperationLog" lang="ts">
import { listOperationLog } from '@/api/procurement/operationlog';
import { OperationLogQuery, OperationLogVO } from '@/api/procurement/operationlog/types';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const logList = ref<OperationLogVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);

/** 业务类型选项 */
const bizTypeOptions = ref([
  { label: '采购申请', value: 'request', elTagType: 'primary' },
  { label: '验收', value: 'acceptance', elTagType: 'success' },
  { label: '领用', value: 'issue', elTagType: 'warning' },
  { label: '仓库', value: 'stock', elTagType: 'info' }
]);

const queryFormRef = ref<ElFormInstance>();
const queryParams = reactive<OperationLogQuery>({
  pageNum: 1,
  pageSize: 10,
  bizType: '',
  operatorName: ''
});

/** 操作时间范围 */
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();

/** 查询流转记录列表 */
const getList = async () => {
  loading.value = true;
  const res = await listOperationLog(applyDateRange({ ...queryParams }));
  logList.value = res.data.rows;
  total.value = res.data.total;
  loading.value = false;
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value?.resetFields();
  resetDateRange();
  handleQuery();
};

onMounted(() => {
  getList();
});
</script>
