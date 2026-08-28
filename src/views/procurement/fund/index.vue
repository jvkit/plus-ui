<template>
  <div class="p-2">
    <!-- 顶部资金汇总卡片 -->
    <el-row :gutter="12" class="mb-[10px]">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="fund-stat">
            <div class="fund-stat-label">总预算</div>
            <div class="fund-stat-value">¥ {{ formatMoney(summary.totalBudget) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="fund-stat">
            <div class="fund-stat-label">已用金额</div>
            <div class="fund-stat-value" style="color: var(--el-color-danger)">¥ {{ formatMoney(summary.totalUsed) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="fund-stat">
            <div class="fund-stat-label">剩余金额</div>
            <div class="fund-stat-value" style="color: var(--el-color-success)">¥ {{ formatMoney(summary.totalRemaining) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="fund-stat">
            <div class="fund-stat-label">本月流出</div>
            <div class="fund-stat-value" style="color: var(--el-color-warning)">¥ {{ formatMoney(summary.monthOut) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 项目视图面板：按项目看预算/已用/剩余/本月流出 -->
    <el-card shadow="hover" class="mb-[10px]">
      <template #header>
        <span>项目资金视图</span>
      </template>
      <el-table :data="summary.projects" size="small" stripe>
        <el-table-column prop="projectName" label="项目" min-width="200" show-overflow-tooltip />
        <el-table-column label="预算" width="140" align="right">
          <template #default="{ row }">¥ {{ formatMoney(row.budget) }}</template>
        </el-table-column>
        <el-table-column label="已用" width="140" align="right">
          <template #default="{ row }">
            <span style="color: var(--el-color-danger)">¥ {{ formatMoney(row.used) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="剩余" width="140" align="right">
          <template #default="{ row }">
            <span :style="{ color: (row.remaining < 0 ? 'var(--el-color-danger)' : 'var(--el-color-success)') }">
              ¥ {{ formatMoney(row.remaining) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="本月流出" width="140" align="right">
          <template #default="{ row }">¥ {{ formatMoney(row.monthOut) }}（{{ row.monthOutCount }}笔）</template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 明细筛选 + 列表 -->
    <el-card shadow="hover">
      <el-form :model="queryParams" :inline="true">
        <el-form-item label="项目" prop="projectId">
          <el-select v-model="queryParams.projectId" placeholder="全部项目" clearable style="width: 200px" @change="handleQuery">
            <el-option v-for="item in summary.projects" :key="item.projectId" :label="item.projectName" :value="item.projectId" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字" prop="requestTitle">
          <el-input v-model="queryParams.requestTitle" placeholder="输入订单名字或编号" clearable style="width: 220px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="发生日期" prop="dateRange">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item style="float: right">
          <el-button v-hasPermi="['procurement:fund:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="fundList" stripe>
        <el-table-column prop="flowNo" label="流水编号" width="170" />
        <el-table-column prop="requestCode" label="申请编号" width="170" />
        <el-table-column prop="requestTitle" label="申请标题" min-width="240" show-overflow-tooltip />
        <el-table-column prop="projectName" label="项目" min-width="160" show-overflow-tooltip />
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span style="color: var(--el-color-danger)">-¥ {{ formatMoney(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="occurDate" label="发生日期" width="110" />
        <el-table-column prop="operatorName" label="审批人" width="110" />
        <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup name="Fund" lang="ts">
import { ref, reactive, onMounted, getCurrentInstance } from 'vue';
import { listFundFlow, getFundSummary } from '@/api/procurement/fund';
import { FundFlowQuery, FundFlowVO, FundSummaryVO } from '@/api/procurement/fund/types';

const { proxy } = getCurrentInstance() as any;
const loading = ref(false);
const total = ref(0);
const fundList = ref<FundFlowVO[]>([]);
const dateRange = ref<string[]>([]);
const summary = ref<FundSummaryVO>({
  totalBudget: 0,
  totalUsed: 0,
  totalRemaining: 0,
  monthOut: 0,
  monthOutCount: 0,
  projects: []
});

const queryParams = reactive<FundFlowQuery>({
  pageNum: 1,
  pageSize: 10,
  projectId: undefined,
  flowType: undefined,
  requestTitle: undefined,
  params: {}
});

/** 查询资金流水分页 */
const getList = async () => {
  loading.value = true;
  try {
    queryParams.params = {};
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.params.beginDate = dateRange.value[0];
      queryParams.params.endDate = dateRange.value[1];
    }
    const res = await listFundFlow(queryParams);
    fundList.value = res.data.rows;
    total.value = res.data.total;
  } finally {
    loading.value = false;
  }
};

/** 加载汇总 */
const loadSummary = async () => {
  const res = await getFundSummary();
  if (res.data) {
    summary.value = res.data;
  }
};

/** 查询按钮 */
const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
  loadSummary();
};

/** 重置按钮 */
const resetQuery = () => {
  dateRange.value = [];
  queryParams.projectId = undefined;
  queryParams.requestTitle = undefined;
  queryParams.params = {};
  handleQuery();
};

/** 导出 */
const handleExport = () => {
  proxy?.modal.confirm('是否确认导出所有资金流水数据项？', () => {
    proxy?.download('procurement/fund/export', { ...queryParams }, `fund_${new Date().getTime()}.xlsx`);
  });
};

/** 金额格式化 */
const formatMoney = (val: number | undefined) => {
  if (val === null || val === undefined) return '0.00';
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

onMounted(() => {
  loadSummary();
  getList();
});
</script>

<style scoped>
.fund-stat {
  text-align: center;
}
.fund-stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.fund-stat-value {
  font-size: 22px;
  font-weight: 600;
}
</style>
