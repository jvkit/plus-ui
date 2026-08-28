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
            <el-form-item label="申请编号">
              <el-input :model-value="form.requestCode" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请标题">
              <el-input :model-value="form.title" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="采购方式">
              <el-input :model-value="form.titleType" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标题名称">
              <el-input :model-value="form.titleName" readonly />
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
            <el-form-item label="采购类型">
              <el-input :model-value="purchaseTypeLabel" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="项目负责人">
              <el-input :model-value="form.leader" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前审批人">
              <el-input :model-value="form.currentApprover || '-'" readonly />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="总金额">
              <el-input :model-value="amountText" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-tag :type="statusTagType">{{ statusLabel }}</el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="申请原因">
          <el-input :model-value="form.applyReason" type="textarea" :rows="3" readonly />
        </el-form-item>
        <el-form-item label="备注">
          <el-input :model-value="form.remark" type="textarea" :rows="2" readonly />
        </el-form-item>

        <!-- 自购：付款截图 -->
        <el-form-item v-if="form.titleType === '自购' && form.paymentScreenshot" label="付款截图">
          <el-image :src="attachmentUrls[form.paymentScreenshot]" style="max-width: 200px; max-height: 200px" :preview-src-list="[attachmentUrls[form.paymentScreenshot]]" fit="contain" />
        </el-form-item>

        <!-- 对公：报价单 + 开票信息 -->
        <template v-if="form.titleType === '对公'">
          <el-form-item v-if="form.quotationUrl" label="报价单">
            <el-link :href="attachmentUrls[form.quotationUrl]" target="_blank" type="primary">查看报价单</el-link>
          </el-form-item>
          <el-form-item v-if="form.invoiceInfo?.title" label="开票抬头">
            <el-input :model-value="form.invoiceInfo.title" readonly />
          </el-form-item>
          <el-form-item v-if="form.invoiceInfo?.taxNo" label="税号">
            <el-input :model-value="form.invoiceInfo.taxNo" readonly />
          </el-form-item>
          <el-form-item v-if="form.invoiceInfo?.addressPhone" label="地址电话">
            <el-input :model-value="form.invoiceInfo.addressPhone" readonly />
          </el-form-item>
          <el-form-item v-if="form.invoiceInfo?.bankAccount" label="开户行账号">
            <el-input :model-value="form.invoiceInfo.bankAccount" readonly />
          </el-form-item>
        </template>
      </el-form>

      <!-- 采购明细 -->
      <el-card shadow="never" class="mt-2">
        <template #header><span>采购明细</span></template>
        <el-table :data="form.items" border size="small">
          <el-table-column label="采购种类" align="center" prop="purchaseType" width="100" />
          <el-table-column label="分类" align="center" min-width="150" :show-overflow-tooltip="true">
            <template #default="scope">{{ scope.row.category1 }} / {{ scope.row.category2 }}</template>
          </el-table-column>
          <el-table-column label="品名" align="center" prop="itemName" min-width="120" :show-overflow-tooltip="true" />
          <el-table-column label="规格" align="center" prop="spec" min-width="90" :show-overflow-tooltip="true" />
          <el-table-column label="品牌" align="center" prop="brand" min-width="90" :show-overflow-tooltip="true" />
          <el-table-column label="单位" align="center" prop="unit" width="70" />
          <el-table-column label="数量" align="center" prop="quantity" width="80" />
          <el-table-column label="单价" align="center" prop="unitPrice" width="90" />
          <el-table-column label="金额" align="center" width="100">
            <template #default="scope"><span>{{ (Number(scope.row.amount) || 0).toFixed(2) }}</span></template>
          </el-table-column>
          <el-table-column label="链接" align="center" width="90">
            <template #default="scope">
              <el-link v-if="scope.row.link" :href="scope.row.link" target="_blank" type="primary">链接</el-link>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="mt-2 text-right font-bold">合计：{{ amountText }} 元</div>
      </el-card>
    </el-card>

    <!-- 提交/审批组件 -->
    <submitVerify ref="submitVerifyRef" :task-variables="taskVariables" @submit-callback="submitCallback" />
    <!-- 审批记录 -->
    <ApprovalRecord ref="approvalRecordRef" />
  </div>
</template>

<script setup name="ProcurementRequestDetail" lang="ts">
import { useRoute } from 'vue-router';
import { getRequest } from '@/api/procurement/request';
import { RequestVO } from '@/api/procurement/request/types';
import { listByIds } from '@/api/system/oss';
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

const form = ref<Partial<RequestVO>>({});
const submitVerifyRef = ref<InstanceType<typeof SubmitVerify>>();
const approvalRecordRef = ref<InstanceType<typeof ApprovalRecord>>();
const attachmentUrls = ref<Record<string, string>>({});

const purchaseTypeLabel = computed(() => {
  const map: Record<string, string> = {
    material: '材料',
    equipment: '设备',
    service: '服务',
    engineering: '工程',
    dangerous: '危化品',
    other: '其他',
    goods: '物资',
    fixed_asset: '固定资产'
  };
  return map[form.value.purchaseType || ''] || form.value.purchaseType || '';
});

const amountText = computed(() => (Number(form.value.amount) || 0).toFixed(2));

const statusMap: Record<string, { label: string; type: string }> = {
  draft: { label: '草稿', type: 'info' },
  waiting: { label: '待审核', type: 'warning' },
  finish: { label: '已完成', type: 'success' },
  back: { label: '已退回', type: 'danger' },
  cancel: { label: '已撤销', type: 'info' },
  invalid: { label: '已作废', type: 'info' },
  termination: { label: '已终止', type: 'info' }
};
const statusLabel = computed(() => statusMap[form.value.status || '']?.label || form.value.status || '');
const statusTagType = computed(() => (statusMap[form.value.status || '']?.type as any) || 'info');

/** 加载附件 URL（字段存的是 ossId） */
const loadAttachmentUrls = async () => {
  const ids: string[] = [];
  if (form.value.paymentScreenshot) ids.push(String(form.value.paymentScreenshot));
  if (form.value.quotationUrl) ids.push(String(form.value.quotationUrl));
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
    const res = await getRequest(routeParams.value.id);
    form.value = res.data;
    await loadAttachmentUrls();
    loading.value = false;
  });
};

/** 提交（仅 mode 后端发起场景用，前端发起走 handleStartWorkFlow 不在此页） */
const submitForm = (status: string, mode: boolean) => {
  // 详情页不承担新建/暂存，仅审批。若未来需要在此发起，可在此补逻辑。
  modal.msgWarning('请在采购申请列表页发起申请');
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
