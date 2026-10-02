<template>
  <div class="p-2">
    <!-- 整卡大切换：Tab 切换时卡片内容整体更换（设计 docs/9.20/设计探讨-备用金与报销流程.md §2） -->
    <el-card shadow="hover" class="mb-[10px]">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- Tab1 备用金视图：自购（备用金）流水，采购单 + 人工登记都在此 -->
        <el-tab-pane label="备用金视图" name="reserve">
          <el-alert type="info" :closable="false" show-icon class="mb8" title="本页为自购（备用金）资金流水，采购单与人工登记都在此" />

          <!-- 备用金账户：按人的额度/占用/回笼（与流水明细上下排） -->
          <div class="section-title">备用金账户</div>
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

          <!-- 自购资金流水明细 -->
          <div class="section-title section-gap">自购资金流水</div>
          <el-form :model="selfQuery" :inline="true">
            <el-form-item label="出纳人" prop="applicantId">
              <el-select v-model="selfQuery.applicantId" placeholder="全部出纳人" clearable style="width: 150px" @change="handleSelfQuery">
                <el-option v-for="item in reserveList" :key="String(item.personId)" :label="item.personName" :value="item.personId" />
              </el-select>
            </el-form-item>
            <el-form-item label="项目" prop="projectId">
              <el-tree-select
                v-model="selfQuery.projectId"
                :data="projectTree"
                :props="treeProps"
                check-strictly
                clearable
                placeholder="全部项目"
                style="width: 180px"
                @change="handleSelfQuery"
              />
            </el-form-item>
            <el-form-item label="流水编号" prop="flowNo">
              <el-input v-model="selfQuery.flowNo" placeholder="请输入流水编号" clearable style="width: 180px" @keyup.enter="handleSelfQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleSelfQuery">查询</el-button>
              <el-button icon="Refresh" @click="resetSelfQuery">重置</el-button>
            </el-form-item>
            <el-form-item style="float: right">
              <el-button v-hasPermi="['procurement:fund:manual']" type="primary" plain icon="Plus" @click="openManualDialog('自购')">登记支出</el-button>
              <el-button v-hasPermi="['procurement:fund:export']" type="warning" plain icon="Download" @click="handleExport('自购')">导出</el-button>
            </el-form-item>
          </el-form>

          <el-table v-loading="selfLoading" :data="selfList" stripe>
            <el-table-column prop="flowNo" label="流水编号" width="170" />
            <el-table-column label="申请编号" width="170">
              <template #default="{ row }">{{ row.requestCode || '\\' }}</template>
            </el-table-column>
            <el-table-column prop="projectName" label="项目" min-width="160" show-overflow-tooltip />
            <el-table-column prop="titleType" label="采购方式" width="90" align="center">
              <template #default="{ row }">{{ row.titleType || '-' }}</template>
            </el-table-column>
            <el-table-column label="备用金出纳人" width="120" align="center">
              <template #default="{ row }">{{ row.applicantName || '-' }}</template>
            </el-table-column>
            <el-table-column label="金额" width="130" align="right">
              <template #default="{ row }">
                <span style="color: var(--el-color-danger)">-¥ {{ formatMoney(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="occurDate" label="发生日期" width="110" />
            <el-table-column label="审批人" width="110" align="center">
              <template #default="{ row }">{{ row.operatorName || '-' }}</template>
            </el-table-column>
            <el-table-column label="资金状态" width="130" align="center">
              <template #default="{ row }">
                <dict-tag v-if="row.fundStatus" :options="pms_fund_status" :value="row.fundStatus" />
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip>
              <template #default="{ row }">{{ row.remark || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="190" class-name="small-padding fixed-width">
              <template #default="{ row }">
                <!-- 仅人工登记（无采购申请）的自购流水可手动推进资金状态，单向不可回溯 -->
                <template v-if="isManualSelfFlow(row)">
                  <el-button
                    v-if="canToUnpaid(row)"
                    v-hasPermi="['procurement:fund:manual']"
                    link
                    type="primary"
                    icon="Select"
                    @click="handleManualStatus(row, 'reimbursed_unpaid')"
                  >
                    置为报销中
                  </el-button>
                  <el-button
                    v-if="canToPaid(row)"
                    v-hasPermi="['procurement:fund:manual']"
                    link
                    type="success"
                    icon="Money"
                    @click="handleManualStatus(row, 'reimbursed_paid')"
                  >
                    置为报销完毕
                  </el-button>
                </template>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>

          <pagination v-show="selfTotal > 0" v-model:page="selfQuery.pageNum" v-model:limit="selfQuery.pageSize" :total="selfTotal" @pagination="getSelfList" />
        </el-tab-pane>

        <!-- Tab2 项目视图：对公流水 + 项目树汇总，不扣备用金 -->
        <el-tab-pane label="项目视图" name="project">
          <el-alert type="info" :closable="false" show-icon class="mb8" title="本页为对公（非备用金）资金流水：项目树汇总 + 明细，人工直支登记也在此" />

          <!-- 项目树汇总：预算/已用/剩余来自资金汇总，备用金已用按自购流水聚合 -->
          <div class="section-title">项目资金汇总</div>
          <el-table v-loading="treeLoading" :data="projectTreeRows" row-key="id" default-expand-all size="small" stripe :tree-props="{ children: 'children' }">
            <el-table-column prop="projectName" label="项目" min-width="240" show-overflow-tooltip />
            <el-table-column label="预算" width="150" align="right">
              <template #default="{ row }">¥ {{ formatMoney(budgetOf(row)) }}</template>
            </el-table-column>
            <el-table-column label="已用" width="150" align="right">
              <template #default="{ row }">
                <span style="color: var(--el-color-danger)">¥ {{ formatMoney(usedOf(row)) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="剩余" width="150" align="right">
              <template #default="{ row }">
                <span :style="{ color: remainingOf(row) < 0 ? 'var(--el-color-danger)' : 'var(--el-color-success)' }"> ¥ {{ formatMoney(remainingOf(row)) }} </span>
              </template>
            </el-table-column>
            <el-table-column label="备用金已用（自购）" width="170" align="right">
              <template #default="{ row }">
                <span style="color: var(--el-color-danger)">¥ {{ formatMoney(selfUsedOf(row)) }}</span>
              </template>
            </el-table-column>
          </el-table>

          <!-- 对公资金流水明细 -->
          <div class="section-title section-gap">对公资金流水</div>
          <el-form :model="publicQuery" :inline="true">
            <el-form-item label="项目" prop="projectId">
              <el-tree-select
                v-model="publicQuery.projectId"
                :data="projectTree"
                :props="treeProps"
                check-strictly
                clearable
                placeholder="全部项目"
                style="width: 180px"
                @change="handlePublicQuery"
              />
            </el-form-item>
            <el-form-item label="流水编号" prop="flowNo">
              <el-input v-model="publicQuery.flowNo" placeholder="请输入流水编号" clearable style="width: 180px" @keyup.enter="handlePublicQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handlePublicQuery">查询</el-button>
              <el-button icon="Refresh" @click="resetPublicQuery">重置</el-button>
            </el-form-item>
            <el-form-item style="float: right">
              <el-button v-hasPermi="['procurement:fund:manual']" type="primary" plain icon="Plus" @click="openManualDialog('对公')">登记支出</el-button>
              <el-button v-hasPermi="['procurement:fund:export']" type="warning" plain icon="Download" @click="handleExport('对公')">导出</el-button>
            </el-form-item>
          </el-form>

          <el-table v-loading="publicLoading" :data="publicList" stripe>
            <el-table-column prop="flowNo" label="流水编号" width="170" />
            <el-table-column label="申请编号" width="170">
              <template #default="{ row }">{{ row.requestCode || '\\' }}</template>
            </el-table-column>
            <el-table-column prop="projectName" label="项目" min-width="160" show-overflow-tooltip />
            <el-table-column prop="titleType" label="采购方式" width="90" align="center">
              <template #default="{ row }">{{ row.titleType || '-' }}</template>
            </el-table-column>
            <el-table-column label="金额" width="130" align="right">
              <template #default="{ row }">
                <span style="color: var(--el-color-danger)">-¥ {{ formatMoney(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="occurDate" label="发生日期" width="110" />
            <el-table-column label="审批人" width="110" align="center">
              <template #default="{ row }">{{ row.operatorName || '-' }}</template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">{{ row.remark || '-' }}</template>
            </el-table-column>
          </el-table>

          <pagination v-show="publicTotal > 0" v-model:page="publicQuery.pageNum" v-model:limit="publicQuery.pageSize" :total="publicTotal" @pagination="getPublicList" />
        </el-tab-pane>

        <!-- Tab3 资金状态看板：原顶部两张统计卡 + 原看板内容合并 -->
        <el-tab-pane label="资金状态看板" name="board">
          <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
              <el-button type="info" plain icon="Refresh" @click="refreshBoard">刷新</el-button>
            </el-col>
          </el-row>

          <div class="ledger-title">项目账本</div>
          <el-row :gutter="12" class="mb-[10px]">
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

          <div class="ledger-title">备用金</div>
          <el-row :gutter="12" class="mb-[10px]">
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

          <div class="ledger-title">报销状态分布</div>
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

    <!-- 人工登记支出（自购=扣备用金按人拆账；对公=直支项目资金） -->
    <el-dialog v-model="manualDialog.visible" :title="manualDialog.title" width="640px" append-to-body>
      <el-form ref="manualFormRef" :model="manualForm" :rules="manualRules" label-width="110px">
        <el-form-item v-if="manualForm.titleType === '自购'" label="备用金出纳人" prop="payers">
          <ReservePicker v-model="manualPayers" :amount="manualForm.amount" @update:model-value="onPayerChange" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="manualForm.amount" :min="0.01" :precision="2" :controls="false" placeholder="支出金额" style="width: 100%" />
        </el-form-item>
        <el-form-item label="项目" prop="projectId">
          <el-tree-select
            v-model="manualForm.projectId"
            :data="projectTree"
            :props="treePropsLeafOnly"
            check-strictly
            clearable
            placeholder="请选择项目（仅叶子可选）"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="manualForm.remark" type="textarea" :rows="2" maxlength="500" placeholder="非采购订单资金消耗" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitManual">确 定</el-button>
          <el-button @click="manualDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

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
import { listFundFlow, getFundSummary, getFundStatusBoard, addManualFundFlow, updateManualFundStatus } from '@/api/procurement/fund';
import { FundFlowQuery, FundFlowVO, FundSummaryVO, FundStatusBoardVO, ManualFundStatus } from '@/api/procurement/fund/types';
import { listReserve, addReserve, updateReserve, listReserveUserOptions } from '@/api/procurement/reserve';
import { ReserveAccountVO, ReserveForm, ReservePerson, ReserveUserOption } from '@/api/procurement/reserve/types';
import { treeProject } from '@/api/procurement/project';
import { ProjectVO } from '@/api/procurement/project/types';
import ReservePicker from '@/components/ReservePicker/index.vue';
import { useDict } from '@/utils/dict';

const { proxy } = getCurrentInstance() as any;
const { pms_fund_status } = toRefs<any>(useDict('pms_fund_status'));

const activeTab = ref('reserve');

const projectTree = ref<ProjectVO[]>([]);
const treeProps = { value: 'id', label: 'projectName', children: 'children' } as any;
/** 表单选项目的 props：只能选叶子（有子级的节点置灰不可选），与采购申请页一致 */
const treePropsLeafOnly = {
  value: 'id',
  label: 'projectName',
  children: 'children',
  disabled: (data: any) => Array.isArray(data.children) && data.children.length > 0
} as any;

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

/* ------------------------------ Tab1 备用金视图 ------------------------------ */

/** 自购流水查询 */
const selfQuery = reactive<FundFlowQuery>({
  pageNum: 1,
  pageSize: 10,
  projectId: undefined,
  flowType: undefined,
  titleType: '自购',
  applicantId: undefined,
  flowNo: undefined
});
const selfLoading = ref(false);
const selfList = ref<FundFlowVO[]>([]);
const selfTotal = ref(0);

/** 资金状态单向链（对齐后端 PmsFundStatusEnum.canTransfer） */
const FUND_STATUS_CHAIN = ['purchased_unreimbursed', 'reimbursed_unpaid', 'reimbursed_paid'];
const statusIndex = (status?: string) => {
  const idx = FUND_STATUS_CHAIN.indexOf(status || '');
  return idx < 0 ? 0 : idx;
};

/** 是否人工登记的自购流水（无采购申请，可手动推进资金状态） */
const isManualSelfFlow = (row: any) => !row.requestId && row.titleType === '自购';
const canToUnpaid = (row: any) => statusIndex(row.fundStatus) < 1;
const canToPaid = (row: any) => statusIndex(row.fundStatus) < 2;

/** 查询自购资金流水 */
const getSelfList = async () => {
  selfLoading.value = true;
  try {
    const res = await listFundFlow(selfQuery);
    selfList.value = res.data.rows;
    selfTotal.value = res.data.total;
  } finally {
    selfLoading.value = false;
  }
};

const handleSelfQuery = () => {
  selfQuery.pageNum = 1;
  getSelfList();
};

const resetSelfQuery = () => {
  selfQuery.projectId = undefined;
  selfQuery.applicantId = undefined;
  selfQuery.flowNo = undefined;
  handleSelfQuery();
};

/** 人工流水资金状态推进（单向不可回溯，二次确认） */
const handleManualStatus = async (row: any, target: ManualFundStatus) => {
  const targetLabel = target === 'reimbursed_unpaid' ? '报销中' : '报销完毕';
  const confirmed = await proxy?.$modal
    .confirm(`确认将流水 ${row.flowNo} 置为「${targetLabel}」？该操作不可回溯，请确认无误后再提交。`)
    .catch(() => false);
  if (!confirmed) return;
  await updateManualFundStatus(row.id, target);
  proxy?.$modal.msgSuccess('操作成功');
  await getSelfList();
  await getReserveList();
  await loadSummary();
};

/* ------------------------------ Tab2 项目视图 ------------------------------ */

/** 对公流水查询 */
const publicQuery = reactive<FundFlowQuery>({
  pageNum: 1,
  pageSize: 10,
  projectId: undefined,
  flowType: undefined,
  titleType: '对公',
  flowNo: undefined
});
const publicLoading = ref(false);
const publicList = ref<FundFlowVO[]>([]);
const publicTotal = ref(0);
const treeLoading = ref(false);

/** 全量自购流水按项目聚合的「备用金已用」：projectId(String) → 金额合计 */
const selfUsedMap = ref<Record<string, number>>({});

/** 项目树（汇总表数据源，原样展开） */
const projectTreeRows = computed(() => projectTree.value);

/** 项目自身维度的汇总映射（后端按项目平铺，含父子各自一行） */
const summaryMap = computed(() => {
  const map: Record<string, { budget: number; used: number; remaining: number }> = {};
  summary.value.projects.forEach((p) => {
    map[String(p.projectId)] = { budget: p.budget, used: p.used, remaining: p.remaining };
  });
  return map;
});

const budgetOf = (row: any) => summaryMap.value[String(row.id)]?.budget ?? 0;

/** 子树汇总：自身 + 所有后代节点按 getter 求和（父级已用/备用金已用需向上汇总） */
const sumTree = (row: any, getter: (id: string) => number): number => {
  let total = Number(getter(String(row.id)) || 0);
  (row.children || []).forEach((child: any) => {
    total += sumTree(child, getter);
  });
  return total;
};

/** 已用：含全部子项目的扣款汇总 */
const usedOf = (row: any) => sumTree(row, (id) => summaryMap.value[id]?.used ?? 0);

/** 剩余 = 本节点预算 - 子树已用汇总 */
const remainingOf = (row: any) => budgetOf(row) - usedOf(row);

/** 备用金已用（自购）：含全部子项目的自购流水汇总 */
const selfUsedOf = (row: any) => sumTree(row, (id) => selfUsedMap.value[id] || 0);

/** 拉取全量自购流水，按项目聚合备用金已用 */
const loadSelfUsedMap = async () => {
  const res = await listFundFlow({ pageNum: 1, pageSize: 9999, projectId: undefined, flowType: undefined, titleType: '自购' });
  const map: Record<string, number> = {};
  (res.data.rows || []).forEach((flow) => {
    const key = String(flow.projectId);
    map[key] = (map[key] || 0) + Number(flow.amount || 0);
  });
  selfUsedMap.value = map;
};

/** 查询对公资金流水 */
const getPublicList = async () => {
  publicLoading.value = true;
  try {
    const res = await listFundFlow(publicQuery);
    publicList.value = res.data.rows;
    publicTotal.value = res.data.total;
  } finally {
    publicLoading.value = false;
  }
};

const handlePublicQuery = () => {
  publicQuery.pageNum = 1;
  getPublicList();
};

const resetPublicQuery = () => {
  publicQuery.projectId = undefined;
  publicQuery.flowNo = undefined;
  handlePublicQuery();
};

/* ------------------------------ Tab3 资金状态看板 ------------------------------ */
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

/** 看板刷新：统计卡 + 状态分布一起刷 */
const refreshBoard = async () => {
  await loadSummary();
  await getBoard();
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

/* ------------------------------ 页签切换 ------------------------------ */

/** 页签切换：按需加载，切回即刷新 */
const handleTabChange = (name: string | number) => {
  if (name === 'reserve') {
    getReserveList();
    getSelfList();
  } else if (name === 'project') {
    loadSummary();
    loadSelfUsedMap();
    getPublicList();
  } else if (name === 'board') {
    refreshBoard();
  }
};

/* ------------------------------ 人工登记支出 ------------------------------ */
const manualFormRef = ref<ElFormInstance>();
const manualDialog = reactive<{ visible: boolean; title: string }>({ visible: false, title: '' });
const manualForm = reactive<{ titleType: '自购' | '对公'; projectId: number | string | undefined; amount: number | undefined; remark: string }>({
  titleType: '自购',
  projectId: undefined,
  amount: undefined,
  remark: ''
});
const manualPayers = ref<ReservePerson[]>([]);
const manualRules = {
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  payers: [
    {
      validator: (_rule: any, _value: any, callback: any) => {
        if (manualForm.titleType === '自购' && manualPayers.value.length === 0) {
          callback(new Error('请选择备用金出纳人'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ]
};

/** 打开登记支出弹窗：自购带备用金选人（金额实时联动锁定），对公仅项目/金额/备注 */
const openManualDialog = (titleType: '自购' | '对公') => {
  manualForm.titleType = titleType;
  manualForm.projectId = undefined;
  manualForm.amount = undefined;
  manualForm.remark = '非采购订单资金消耗';
  manualPayers.value = [];
  manualDialog.title = titleType === '自购' ? '登记支出（自购/备用金）' : '登记支出（对公直支）';
  manualDialog.visible = true;
  nextTick(() => manualFormRef.value?.clearValidate());
};

/** 备用金人变化时手动触发表单校验（ReservePicker 是自定义组件，blur/change 不会自动触发） */
const onPayerChange = () => {
  manualFormRef.value?.validateField('payers');
};

/** 提交人工登记：成功后刷新当前页签数据 + 账户 + 汇总 */
const submitManual = () => {
  manualFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    await addManualFundFlow({
      titleType: manualForm.titleType,
      projectId: manualForm.projectId,
      amount: Number(manualForm.amount),
      remark: manualForm.remark,
      payers: manualForm.titleType === '自购' ? manualPayers.value : undefined
    });
    proxy?.$modal.msgSuccess('登记成功');
    manualDialog.visible = false;
    if (activeTab.value === 'reserve') {
      await getSelfList();
    } else if (activeTab.value === 'project') {
      await getPublicList();
      await loadSelfUsedMap();
    }
    await getReserveList();
    await loadSummary();
  });
};

/* ------------------------------ 备用金账户 ------------------------------ */
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

/** 选人下拉（新增账户用） */
const loadUserOptions = async () => {
  const res = await listReserveUserOptions();
  userOptions.value = res.data || [];
};

/** 新增账户 */
const handleReserveAdd = () => {
  openReserveDialog('新增备用金账户', { id: undefined, personId: undefined, quota: 10000, remark: '' });
};

/** 修改额度 */
const handleReserveEdit = (row: any) => {
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

/* ------------------------------ 公共 ------------------------------ */

/** 加载汇总（项目账本 + 备用金） */
const loadSummary = async () => {
  const res = await getFundSummary();
  if (res.data) {
    summary.value = res.data;
  }
};

/** 加载项目树（筛选 + 登记弹窗 + 项目树汇总表共用） */
const loadProjectTree = async () => {
  treeLoading.value = true;
  try {
    const res = await treeProject();
    projectTree.value = res.data || [];
  } finally {
    treeLoading.value = false;
  }
};

/** 导出当前页签的流水 */
const handleExport = (titleType: '自购' | '对公') => {
  proxy?.$modal.confirm(`是否确认导出${titleType}资金流水数据项？`).then(() => {
    const query = titleType === '自购' ? { ...selfQuery } : { ...publicQuery };
    proxy?.download('procurement/fund/export', { ...query, titleType }, `fund_${titleType}_${new Date().getTime()}.xlsx`);
  });
};

/** 金额格式化（两位小数） */
const formatMoney = (val: number | string | undefined | null) => {
  if (val === null || val === undefined || val === '') return '0.00';
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

onMounted(() => {
  loadProjectTree();
  loadUserOptions();
  loadSummary();
  getReserveList();
  getSelfList();
});
</script>

<style scoped>
.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
  padding-left: 8px;
  border-left: 3px solid var(--el-color-primary);
}
.section-gap {
  margin-top: 18px;
}
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
