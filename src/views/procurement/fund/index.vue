<template>
  <div class="p-2">
    <!-- 顶部账本卡片：项目账本 + 备用金（两本账解耦，备用金操作不影响项目资金） -->
    <el-card shadow="hover" class="mb-[10px]">
      <div class="ledger-title">项目账本</div>
      <el-row :gutter="12">
        <el-col :span="6">
          <div class="fund-stat">
            <div class="fund-stat-label">总预算</div>
            <div class="fund-stat-value">¥ {{ formatMoney(summary.totalBudget) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="fund-stat">
            <div class="fund-stat-label">已用金额</div>
            <div class="fund-stat-value" style="color: var(--el-color-danger)">¥ {{ formatMoney(summary.totalUsed) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="fund-stat">
            <div class="fund-stat-label">剩余金额</div>
            <div class="fund-stat-value" style="color: var(--el-color-success)">¥ {{ formatMoney(summary.totalRemaining) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="fund-stat">
            <div class="fund-stat-label">本月流出</div>
            <div class="fund-stat-value" style="color: var(--el-color-warning)">
              ¥ {{ formatMoney(summary.monthOut) }}
              <span class="fund-stat-sub">（{{ summary.monthOutCount || 0 }}笔）</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="hover" class="mb-[10px]">
      <div class="ledger-title">备用金</div>
      <el-row :gutter="12">
        <el-col :span="6">
          <div class="fund-stat">
            <div class="fund-stat-label">总额度</div>
            <div class="fund-stat-value">¥ {{ formatMoney(reserve.totalQuota) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="fund-stat">
            <div class="fund-stat-label">已占用</div>
            <div class="fund-stat-value" style="color: var(--el-color-danger)">¥ {{ formatMoney(reserve.occupied) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="fund-stat">
            <div class="fund-stat-label">可用</div>
            <div
              class="fund-stat-value"
              :style="{ color: Number(reserve.available) < 0 ? 'var(--el-color-danger)' : 'var(--el-color-success)' }"
            >
              ¥ {{ formatMoney(reserve.available) }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="fund-stat">
            <div class="fund-stat-label">已回笼</div>
            <div class="fund-stat-value" style="color: var(--el-color-primary)">¥ {{ formatMoney(reserve.recycled) }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 四个视图页签 -->
    <el-card shadow="hover" class="mb-[10px]">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 项目视图 -->
        <el-tab-pane label="项目视图" name="project">
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
                <span :style="{ color: row.remaining < 0 ? 'var(--el-color-danger)' : 'var(--el-color-success)' }"> ¥ {{ formatMoney(row.remaining) }} </span>
              </template>
            </el-table-column>
            <el-table-column label="本月流出" width="160" align="right">
              <template #default="{ row }">¥ {{ formatMoney(row.monthOut) }}（{{ row.monthOutCount }}笔）</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 备用金视图：按人的额度 + 占用 -->
        <el-tab-pane label="备用金视图" name="reserve">
          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button v-hasPermi="['procurement:fund:quota']" type="primary" plain icon="Plus" @click="handleReserveAdd">新增账户</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="info" plain icon="Refresh" @click="getReserveList">刷新</el-button>
            </el-col>
          </el-row>
          <el-table v-loading="reserveLoading" :data="reserveList" size="small" stripe>
            <el-table-column prop="personName" label="人员" min-width="120" show-overflow-tooltip />
            <el-table-column label="额度" width="140" align="right">
              <template #default="{ row }">¥ {{ formatMoney(row.quota) }}</template>
            </el-table-column>
            <el-table-column label="已占用" width="140" align="right">
              <template #default="{ row }">
                <span style="color: var(--el-color-danger)">¥ {{ formatMoney(row.occupied) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="可用" width="140" align="right">
              <template #default="{ row }">
                <span :style="{ color: row.available < 0 ? 'var(--el-color-danger)' : 'var(--el-color-success)' }"> ¥ {{ formatMoney(row.available) }} </span>
              </template>
            </el-table-column>
            <el-table-column prop="unreimbursedCount" label="未报销笔数" width="110" align="center" />
            <el-table-column label="已回笼" width="140" align="right">
              <template #default="{ row }">
                <span style="color: var(--el-color-primary)">¥ {{ formatMoney(row.recycled) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ row.remark || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="100" class-name="small-padding fixed-width">
              <template #default="{ row }">
                <el-tooltip content="修改额度" placement="top">
                  <el-button v-hasPermi="['procurement:fund:quota']" link type="primary" icon="Edit" @click="handleReserveEdit(row)"></el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 资金状态管理：资金管理员主战场（手动、单向、不可回溯） -->
        <el-tab-pane label="资金状态管理" name="status">
          <el-form ref="statusQueryFormRef" :model="statusQuery" :inline="true">
            <el-form-item label="资金状态" prop="fundStatus">
              <el-select v-model="statusQuery.fundStatus" placeholder="全部状态" clearable style="width: 170px" @change="handleStatusQuery">
                <el-option v-for="dict in pms_fund_status" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="项目" prop="projectId">
              <el-tree-select
                v-model="statusQuery.projectId"
                :data="projectTree"
                :props="treeProps"
                check-strictly
                clearable
                placeholder="全部项目"
                style="width: 180px"
                @change="handleStatusQuery"
              />
            </el-form-item>
            <el-form-item label="采购方式" prop="titleType">
              <el-select v-model="statusQuery.titleType" placeholder="全部方式" clearable style="width: 120px" @change="handleStatusQuery">
                <el-option label="自购" value="自购" />
                <el-option label="对公" value="对公" />
              </el-select>
            </el-form-item>
            <el-form-item label="申请人" prop="applicantName">
              <el-input v-model="statusQuery.applicantName" placeholder="请输入申请人" clearable style="width: 150px" @keyup.enter="handleStatusQuery" />
            </el-form-item>
            <el-form-item label="申请编号" prop="requestCode">
              <el-input v-model="statusQuery.requestCode" placeholder="请输入申请编号" clearable style="width: 180px" @keyup.enter="handleStatusQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleStatusQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetStatusQuery">重置</el-button>
            </el-form-item>
          </el-form>

          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button
                v-hasPermi="['procurement:fund:status']"
                type="success"
                plain
                icon="Select"
                :disabled="statusIds.length === 0"
                @click="handleFundStatus('reimburse')"
              >
                标记已报销
              </el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button
                v-hasPermi="['procurement:fund:status']"
                type="primary"
                plain
                icon="Money"
                :disabled="statusIds.length === 0"
                @click="handleFundStatus('paid')"
              >
                确认已汇款
              </el-button>
            </el-col>
            <el-col :span="1.5">
              <span class="status-tip">已选 {{ statusIds.length }} 笔 · 状态变更不可回溯</span>
            </el-col>
          </el-row>

          <el-table ref="statusTableRef" v-loading="statusLoading" :data="statusList" size="small" stripe @selection-change="handleStatusSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="requestCode" label="申请编号" width="170" show-overflow-tooltip />
            <el-table-column prop="titleName" label="标题" min-width="180" show-overflow-tooltip />
            <el-table-column prop="projectName" label="项目" min-width="150" show-overflow-tooltip />
            <el-table-column label="申请人" width="100" align="center">
              <template #default="{ row }">{{ applicantNameOf(row) }}</template>
            </el-table-column>
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">¥ {{ formatMoney(row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="titleType" label="采购方式" width="90" align="center" />
            <el-table-column label="资金状态" width="130" align="center">
              <template #default="{ row }">
                <dict-tag v-if="row.fundStatus" :options="pms_fund_status" :value="row.fundStatus" />
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="报销包编号" width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ row.reimbursementCode || '-' }}</template>
            </el-table-column>
            <el-table-column label="报销标记" width="180" align="center">
              <template #default="{ row }">
                <span v-if="row.reimburseByName || row.reimburseDate">{{ row.reimburseByName || '-' }} {{ formatDateTime(row.reimburseDate) }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="汇款确认" width="180" align="center">
              <template #default="{ row }">
                <span v-if="row.paidByName || row.paidDate">{{ row.paidByName || '-' }} {{ formatDateTime(row.paidDate) }}</span>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>

          <pagination
            v-show="statusTotal > 0"
            v-model:page="statusQuery.pageNum"
            v-model:limit="statusQuery.pageSize"
            :total="statusTotal"
            @pagination="getStatusList"
          />
        </el-tab-pane>

        <!-- 资金状态看板：催办用 -->
        <el-tab-pane label="资金状态看板" name="board">
          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button type="info" plain icon="Refresh" @click="getBoard">刷新</el-button>
            </el-col>
          </el-row>
          <div v-loading="boardLoading">
            <el-row :gutter="12">
              <el-col v-for="item in boardList" :key="item.status" :span="6">
                <div class="board-card" :style="{ borderTopColor: boardColor(item.status) }">
                  <div class="board-label">{{ item.label }}</div>
                  <div class="board-count" :style="{ color: boardColor(item.status) }">{{ item.count || 0 }} 笔</div>
                  <div class="board-amount">¥ {{ formatMoney(item.amount) }}</div>
                </div>
              </el-col>
            </el-row>
            <el-empty v-if="!boardLoading && boardList.length === 0" description="暂无统计数据" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 流水明细 -->
    <el-card shadow="hover">
      <template #header>
        <span>流水明细</span>
      </template>
      <el-form :model="queryParams" :inline="true">
        <el-form-item label="项目" prop="projectId">
          <el-select v-model="queryParams.projectId" placeholder="全部项目" clearable style="width: 200px" @change="handleQuery">
            <el-option v-for="item in summary.projects" :key="item.projectId" :label="item.projectName" :value="item.projectId" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购方式" prop="titleType">
          <el-select v-model="queryParams.titleType" placeholder="全部方式" clearable style="width: 120px" @change="handleQuery">
            <el-option label="自购" value="自购" />
            <el-option label="对公" value="对公" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请人" prop="applicantName">
          <el-input v-model="queryParams.applicantName" placeholder="请输入申请人" clearable style="width: 150px" @keyup.enter="handleQuery" />
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
        <el-table-column prop="titleType" label="采购方式" width="90" align="center">
          <template #default="{ row }">{{ row.titleType || '-' }}</template>
        </el-table-column>
        <el-table-column prop="applicantName" label="申请人" width="100" align="center">
          <template #default="{ row }">{{ row.applicantName || '-' }}</template>
        </el-table-column>
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

    <!-- 备用金账户：新增 / 改额度 -->
    <el-dialog v-model="reserveDialog.visible" :title="reserveDialog.title" width="520px" append-to-body>
      <el-form ref="reserveFormRef" :model="reserveForm" :rules="reserveRules" label-width="90px">
        <el-form-item label="人员" prop="personId">
          <el-select
            v-model="reserveForm.personId"
            placeholder="请选择人员"
            clearable
            filterable
            style="width: 100%"
            :disabled="reserveForm.id !== undefined"
          >
            <el-option v-for="item in userOptions" :key="item.userId" :label="item.nickName" :value="item.userId" />
          </el-select>
        </el-form-item>
        <el-form-item label="额度" prop="quota">
          <el-input-number v-model="reserveForm.quota" :min="0" :precision="2" :controls="false" placeholder="默认 10000.00" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="reserveForm.remark" type="textarea" :rows="2" placeholder="如：2026-09 调增至 2 万" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitReserve">确 定</el-button>
          <el-button @click="reserveDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Fund" lang="ts">
import { ref, reactive, computed, toRefs, nextTick, onMounted, getCurrentInstance } from 'vue';
import { listFundFlow, getFundSummary, getFundStatusBoard, updateFundStatus } from '@/api/procurement/fund';
import { FundFlowQuery, FundFlowVO, FundStatusAction, FundStatusBoardVO, FundSummaryVO } from '@/api/procurement/fund/types';
import { listReserve, addReserve, updateReserve, listReserveUserOptions } from '@/api/procurement/reserve';
import { ReserveAccountVO, ReserveForm, ReserveUserOption } from '@/api/procurement/reserve/types';
import { listRequest } from '@/api/procurement/request';
import { RequestQuery, RequestVO } from '@/api/procurement/request/types';
import { treeProject } from '@/api/procurement/project';
import { ProjectVO } from '@/api/procurement/project/types';
import { useDict } from '@/utils/dict';

const { proxy } = getCurrentInstance() as any;
const { pms_fund_status } = toRefs<any>(useDict('pms_fund_status'));

const activeTab = ref('project');
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

/** 备用金汇总（后端未返回时兜 0，避免页面显示 undefined） */
const reserve = computed(() => summary.value.reserve || { totalQuota: 0, occupied: 0, available: 0, recycled: 0 });

const queryParams = reactive<FundFlowQuery>({
  pageNum: 1,
  pageSize: 10,
  projectId: undefined,
  flowType: undefined,
  requestTitle: undefined,
  titleType: undefined,
  applicantName: undefined,
  params: {}
});

/* ------------------------------ 备用金视图 ------------------------------ */
const reserveLoading = ref(false);
const reserveList = ref<ReserveAccountVO[]>([]);
const userOptions = ref<ReserveUserOption[]>([]);
const reserveFormRef = ref<ElFormInstance>();
const reserveDialog = reactive<DialogOption>({ visible: false, title: '' });
const reserveForm = ref<ReserveForm>({ id: undefined, personId: undefined, quota: undefined, remark: '' });
const reserveRules = {
  personId: [{ required: true, message: '请选择人员', trigger: 'change' }],
  quota: [{ required: true, message: '请输入额度', trigger: 'blur' }]
};

/** 查询备用金账户列表 */
const getReserveList = async () => {
  reserveLoading.value = true;
  try {
    const res = await listReserve();
    reserveList.value = res.data || [];
  } finally {
    reserveLoading.value = false;
  }
};

/** 选人下拉（新增账户 + 申请人姓名翻译共用） */
const loadUserOptions = async () => {
  const res = await listReserveUserOptions();
  userOptions.value = res.data || [];
};

/** 用户ID → 姓名（申请列表无申请人姓名字段，用 createBy 翻译） */
const userNameMap = computed(() => {
  const map: Record<string, string> = {};
  userOptions.value.forEach((item) => {
    map[String(item.userId)] = item.nickName;
  });
  return map;
});

const applicantNameOf = (row: RequestVO) => {
  if (row.createBy === undefined || row.createBy === null) return '-';
  return userNameMap.value[String(row.createBy)] || '-';
};

/** 新增账户 */
const handleReserveAdd = () => {
  openReserveDialog('新增备用金账户', { id: undefined, personId: undefined, quota: 10000, remark: '' });
};

/** 修改额度 */
const handleReserveEdit = (row: ReserveAccountVO) => {
  openReserveDialog(`修改备用金额度 - ${row.personName}`, {
    id: row.id,
    personId: row.personId,
    quota: Number(row.quota) || 0,
    remark: row.remark || ''
  });
};

/** 打开账户弹窗：先赋值再清校验，避免上一次的校验提示残留 */
const openReserveDialog = (title: string, data: ReserveForm) => {
  reserveForm.value = { ...data };
  reserveDialog.title = title;
  reserveDialog.visible = true;
  nextTick(() => reserveFormRef.value?.clearValidate());
};

/** 提交账户新增/改额度 */
const submitReserve = () => {
  reserveFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (reserveForm.value.id) {
      await updateReserve({ id: reserveForm.value.id, quota: reserveForm.value.quota, remark: reserveForm.value.remark });
    } else {
      await addReserve({ personId: reserveForm.value.personId, quota: reserveForm.value.quota, remark: reserveForm.value.remark });
    }
    proxy?.$modal.msgSuccess('操作成功');
    reserveDialog.visible = false;
    await getReserveList();
    await loadSummary();
  });
};

/* ---------------------------- 资金状态管理 ---------------------------- */
const statusLoading = ref(false);
const statusList = ref<RequestVO[]>([]);
const statusTotal = ref(0);
const statusIds = ref<Array<number | string>>([]);
const statusTableRef = ref();
const statusQueryFormRef = ref<ElFormInstance>();
const projectTree = ref<ProjectVO[]>([]);
const treeProps = { value: 'id', label: 'projectName', children: 'children' } as any;

const statusQuery = reactive<RequestQuery>({
  pageNum: 1,
  pageSize: 10,
  requestCode: '',
  title: '',
  projectId: undefined,
  // 资金状态只存在于审批通过的申请上，本 Tab 固定只看 finish，避免草稿/审批中的单子混进来被误勾选
  status: 'finish',
  purchaseType: '',
  titleType: undefined,
  fundStatus: undefined,
  applicantName: undefined
});

/** 查询资金状态列表（复用采购申请列表接口） */
const getStatusList = async () => {
  statusLoading.value = true;
  try {
    const res = await listRequest(statusQuery);
    statusList.value = res.data.rows;
    statusTotal.value = res.data.total;
  } finally {
    statusLoading.value = false;
  }
};

const handleStatusQuery = () => {
  statusQuery.pageNum = 1;
  getStatusList();
};

const resetStatusQuery = () => {
  statusQueryFormRef.value?.resetFields();
  statusQuery.requestCode = '';
  statusQuery.projectId = undefined;
  statusQuery.titleType = undefined;
  statusQuery.fundStatus = undefined;
  statusQuery.applicantName = undefined;
  handleStatusQuery();
};

const handleStatusSelectionChange = (selection: RequestVO[]) => {
  statusIds.value = selection.map((item) => item.id);
};

/** 批量标记已报销 / 确认已汇款（单向不可回溯，必须二次确认并展示后端 msg） */
const handleFundStatus = async (action: FundStatusAction) => {
  if (statusIds.value.length === 0) {
    proxy?.$modal.msgError('请先勾选需要处理的采购申请');
    return;
  }
  const actionLabel = action === 'reimburse' ? '标记为「已报销」' : '确认为「已汇款」';
  const confirmed = await proxy?.$modal
    .confirm(`确认将选中的 ${statusIds.value.length} 笔采购申请${actionLabel}？该操作不可回溯，请确认无误后再提交。`)
    .catch(() => false);
  if (!confirmed) return;
  const res = await updateFundStatus({ ids: statusIds.value, action });
  proxy?.$modal.alertSuccess(res.msg || '操作成功');
  statusTableRef.value?.clearSelection();
  statusIds.value = [];
  await getStatusList();
  await loadSummary();
  if (boardList.value.length > 0) {
    await getBoard();
  }
};

/* ---------------------------- 资金状态看板 ---------------------------- */
const boardLoading = ref(false);
const boardList = ref<FundStatusBoardVO[]>([]);

const getBoard = async () => {
  boardLoading.value = true;
  try {
    const res = await getFundStatusBoard();
    boardList.value = res.data || [];
  } finally {
    boardLoading.value = false;
  }
};

const boardColor = (status: string) => {
  const colors: Record<string, string> = {
    purchased_unreimbursed: 'var(--el-color-warning)',
    reimbursed_unpaid: 'var(--el-color-primary)',
    reimbursed_paid: 'var(--el-color-success)',
    not_applicable: 'var(--el-color-info)'
  };
  return colors[status] || 'var(--el-color-info)';
};

/** 页签切换：按需加载，切回即刷新 */
const handleTabChange = (name: string | number) => {
  if (name === 'reserve') {
    getReserveList();
  } else if (name === 'status') {
    getStatusList();
  } else if (name === 'board') {
    getBoard();
  }
};

/* ------------------------------ 流水明细 ------------------------------ */

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

/** 加载汇总（项目账本 + 备用金） */
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
  queryParams.titleType = undefined;
  queryParams.applicantName = undefined;
  queryParams.params = {};
  handleQuery();
};

/** 导出 */
const handleExport = () => {
  proxy?.$modal.confirm('是否确认导出所有资金流水数据项？').then(() => {
    proxy?.download('procurement/fund/export', { ...queryParams }, `fund_${new Date().getTime()}.xlsx`);
  });
};

/** 金额格式化（两位小数） */
const formatMoney = (val: number | string | undefined | null) => {
  if (val === null || val === undefined || val === '') return '0.00';
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** 日期时间格式化（后端 datetime 可能是 ISO 串，统一走 parseTime） */
const formatDateTime = (val?: string) => {
  return val ? proxy?.parseTime(val, '{y}-{m}-{d} {h}:{i}') : '';
};

/** 加载项目树（资金状态管理的项目筛选） */
const loadProjectTree = async () => {
  const res = await treeProject();
  projectTree.value = res.data || [];
};

onMounted(() => {
  loadSummary();
  getList();
  loadProjectTree();
  loadUserOptions();
});
</script>

<style scoped>
.ledger-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
}
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
.fund-stat-sub {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.status-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 32px;
}
.board-card {
  border: 1px solid var(--el-border-color-lighter);
  border-top: 3px solid var(--el-color-info);
  border-radius: 4px;
  padding: 16px 12px;
  text-align: center;
}
.board-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}
.board-count {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.2;
}
.board-amount {
  margin-top: 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
