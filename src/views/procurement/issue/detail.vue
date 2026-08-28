<template>
  <div class="p-2">
    <el-card shadow="never">
      <!-- 审批操作条 -->
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
            <el-form-item label="领用编号">
              <el-input :model-value="form.issueCode" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="品名">
              <el-input :model-value="form.itemName" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="规格">
              <el-input :model-value="form.spec" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可用数量">
              <el-input :model-value="String(form.qtyAvailable ?? '')" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="领用数量">
              <el-input :model-value="String(form.qtyRequested ?? '')" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请人">
              <el-input :model-value="form.applicant" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-tag :type="statusTagType">{{ statusLabel }}</el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前审批人">
              <el-input :model-value="form.currentApprover || '-'" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="用途">
          <el-input :model-value="form.purpose" type="textarea" :rows="3" readonly />
        </el-form-item>
        <el-form-item label="备注">
          <el-input :model-value="form.remark" type="textarea" :rows="2" readonly />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 提交/审批组件 -->
    <submitVerify ref="submitVerifyRef" :task-variables="taskVariables" @submit-callback="submitCallback" />
    <!-- 审批记录 -->
    <ApprovalRecord ref="approvalRecordRef" />
  </div>
</template>

<script setup name="ProcurementIssueDetail" lang="ts">
import { useRoute } from 'vue-router';
import { getIssue } from '@/api/procurement/issue';
import { IssueVO } from '@/api/procurement/issue/types';
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

const form = ref<Partial<IssueVO>>({});
const submitVerifyRef = ref<InstanceType<typeof SubmitVerify>>();
const approvalRecordRef = ref<InstanceType<typeof ApprovalRecord>>();

const statusMap: Record<string, { label: string; type: string }> = {
  pending: { label: '待审', type: 'info' },
  approved: { label: '已通过', type: 'success' },
  rejected: { label: '已拒绝', type: 'danger' },
  issued: { label: '已出库', type: 'warning' },
  draft: { label: '草稿', type: 'info' },
  waiting: { label: '待审核', type: 'warning' },
  finish: { label: '已完成', type: 'success' },
  back: { label: '已退回', type: 'danger' }
};
const statusLabel = computed(() => statusMap[form.value.status || '']?.label || form.value.status || '');
const statusTagType = computed(() => (statusMap[form.value.status || '']?.type as any) || 'info');

/** 获取详情 */
const getInfo = () => {
  loading.value = true;
  nextTick(async () => {
    const res = await getIssue(routeParams.value.id);
    form.value = res.data;
    loading.value = false;
  });
};

/** 提交（详情页不承担发起，仅审批） */
const submitForm = (_status: string, _mode: boolean) => {
  modal.msgWarning('请在领用申请列表页发起申请');
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
