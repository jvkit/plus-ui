<template>
  <div class="p-2">
    <el-card shadow="never">
      <!-- 审批操作条：提交/审批/流程进度/返回（按路由 type 自动显隐） -->
      <approvalButton
        @submitForm="submitForm"
        @approvalVerifyOpen="approvalVerifyOpen"
        @handleApprovalRecord="handleApprovalRecord"
        :buttonLoading="buttonLoading"
        :id="form.id"
        :status="form.status"
        :pageType="routeParams.type"
        :mode="false"
      />
    </el-card>
    <el-card shadow="never" class="mt-2" style="min-height: 78vh">
      <el-form v-loading="loading" :disabled="routeParams.type === 'view' || routeParams.type === 'approval'" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="验收编号">
              <el-input :model-value="form.acceptanceCode" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="关联申请">
              <el-input :model-value="form.requestTitle || form.requestCode" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="项目">
              <el-input :model-value="form.projectName" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="验收操作人">
              <el-input :model-value="form.operator" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="验收日期">
              <el-input :model-value="formatDate(form.acceptanceDate)" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-tag :type="statusTagType">{{ statusLabel }}</el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="当前审批人">
              <el-input :model-value="form.currentApprover || '-'" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input :model-value="form.remark" type="textarea" :rows="2" readonly />
        </el-form-item>
      </el-form>

      <!-- 验收明细 -->
      <el-card shadow="never" class="mt-2">
        <template #header><span>验收明细</span></template>
        <el-table :data="form.items" border size="small">
          <el-table-column label="品名" align="center" prop="itemName" min-width="120" :show-overflow-tooltip="true" />
          <el-table-column label="规格" align="center" prop="spec" min-width="90" :show-overflow-tooltip="true" />
          <el-table-column label="申请单价" align="center" width="100">
            <template #default="scope"><span>{{ (Number(scope.row.applyPrice) || 0).toFixed(2) }}</span></template>
          </el-table-column>
          <el-table-column label="发票金额" align="center" width="110">
            <template #default="scope"><span>{{ (Number(scope.row.invoicePrice) || 0).toFixed(2) }}</span></template>
          </el-table-column>
          <el-table-column label="金额核对" align="center" width="90">
            <template #default="scope">
              <el-tag :type="scope.row.priceCheck === 'over' ? 'danger' : 'success'">{{ scope.row.priceCheck === 'over' ? '冲红' : '通过' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="实物图片" align="center" width="100">
            <template #default="scope">
              <el-image v-if="scope.row.photoUrl" :src="attachmentUrls[scope.row.photoUrl]" style="max-width: 60px; max-height: 60px" :preview-src-list="[attachmentUrls[scope.row.photoUrl]]" fit="contain" />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="发票附件" align="center" width="100">
            <template #default="scope">
              <el-link v-if="scope.row.invoiceUrl" :href="attachmentUrls[scope.row.invoiceUrl]" target="_blank" type="primary">查看</el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" align="center" prop="remark" min-width="120" :show-overflow-tooltip="true" />
        </el-table>
      </el-card>
    </el-card>

    <!-- 提交/审批组件 -->
    <submitVerify ref="submitVerifyRef" :task-variables="taskVariables" @submit-callback="submitCallback" />
    <!-- 审批记录 -->
    <ApprovalRecord ref="approvalRecordRef" />
  </div>
</template>

<script setup name="ProcurementAcceptanceDetail" lang="ts">
import { useRoute } from 'vue-router';
import { getAcceptance } from '@/api/procurement/acceptance';
import { AcceptanceVO } from '@/api/procurement/acceptance/types';
import { listByIds } from '@/api/system/oss';
import { formatDate } from '@/utils';
import ApprovalButton from '@/components/Process/approvalButton.vue';
import ApprovalRecord from '@/components/Process/approvalRecord.vue';
import SubmitVerify from '@/components/Process/submitVerify.vue';
import modal from '@/plugins/modal';
import tab from '@/plugins/tab';
import router from '@/router';

const route = useRoute();

const loading = ref(true);
const buttonLoading = ref(false);
const routeParams = ref<Record<string, any>>({});
const taskVariables = ref<Record<string, any>>({});

const form = ref<Partial<AcceptanceVO>>({});
const submitVerifyRef = ref<InstanceType<typeof SubmitVerify>>();
const approvalRecordRef = ref<InstanceType<typeof ApprovalRecord>>();
const attachmentUrls = ref<Record<string, string>>({});

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待验收', type: 'info' },
  partial: { label: '部分验收', type: 'warning' },
  finished: { label: '已完成', type: 'success' },
  rejected: { label: '不合格', type: 'danger' },
  draft: { label: '草稿', type: 'info' },
  waiting: { label: '待审核', type: 'warning' },
  finish: { label: '已完成', type: 'success' },
  back: { label: '已退回', type: 'danger' }
};
const statusLabel = computed(() => statusMap[form.value.status || '']?.label || form.value.status || '');
const statusTagType = computed(() => (statusMap[form.value.status || '']?.type as any) || 'info');

/** 加载附件 URL（字段存的是 ossId） */
const loadAttachmentUrls = async () => {
  const ids: string[] = [];
  form.value.items?.forEach(item => {
    if (item.photoUrl) ids.push(String(item.photoUrl));
    if (item.invoiceUrl) ids.push(String(item.invoiceUrl));
  });
  if (ids.length === 0) return;
  const res = await listByIds(ids.join(','));
  res.data.forEach(oss => {
    attachmentUrls.value[oss.ossId] = oss.url;
  });
};

/** 获取详情 */
const getInfo = () => {
  loading.value = true;
  nextTick(async () => {
    const res = await getAcceptance(routeParams.value.id);
    form.value = res.data;
    await loadAttachmentUrls();
    loading.value = false;
  });
};

/** 提交（详情页不承担发起，仅审批；发起在列表页） */
const submitForm = (_status: string, _mode: boolean) => {
  modal.msgWarning('请在采购验收列表页发起验收');
};

/** 审批 */
const approvalVerifyOpen = async () => {
  submitVerifyRef.value?.openDialog(routeParams.value.taskId);
};

/** 审批记录 */
const handleApprovalRecord = () => {
  approvalRecordRef.value?.init(form.value.id);
};

/** 提交回调 */
const submitCallback = async () => {
  await tab.closePage(route);
  router.go(-1);
};

onMounted(() => {
  nextTick(async () => {
    routeParams.value = route.query;
    loading.value = false;
    if (routeParams.value.type === 'view' || routeParams.value.type === 'approval' || routeParams.value.type === 'update') {
      getInfo();
    }
  });
});
</script>
