<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div v-show="showSearch" class="mb-[10px]">
        <el-card shadow="hover">
          <el-form ref="queryFormRef" :model="queryParams" :inline="true">
            <el-form-item label="验收编号" prop="acceptanceCode">
              <el-input v-model="queryParams.acceptanceCode" placeholder="请输入验收编号" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item label="关联申请" prop="requestId">
              <el-select v-model="queryParams.requestId" placeholder="请选择采购申请" clearable style="width: 200px">
                <el-option v-for="item in requestOptions" :key="item.id" :label="item.title || item.requestCode" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="项目" prop="projectId">
              <el-select v-model="queryParams.projectId" placeholder="请选择项目" clearable style="width: 180px">
                <el-option v-for="item in projectOptions" :key="item.id" :label="item.projectName" :value="item.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="status">
              <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 120px">
                <el-option label="待验收" value="pending" />
                <el-option label="部分验收" value="partial" />
                <el-option label="已完成" value="finished" />
                <el-option label="不合格" value="rejected" />
                <el-option label="待审核" value="waiting" />
                <el-option label="已退回" value="back" />
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
            <el-button v-hasPermi="['procurement:acceptance:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:acceptance:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:acceptance:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button v-hasPermi="['procurement:acceptance:export']" type="warning" plain icon="Download" @click="handleExport">导出</el-button>
          </el-col>
          <right-toolbar v-model:show-search="showSearch" @query-table="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" border :data="acceptanceList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column v-if="false" label="主键" align="center" prop="id" />
        <el-table-column label="验收编号" align="center" prop="acceptanceCode" width="170" :show-overflow-tooltip="true" />
        <el-table-column label="关联申请" align="center" prop="requestTitle" min-width="180" :show-overflow-tooltip="true" />
        <el-table-column label="项目" align="center" prop="projectName" :show-overflow-tooltip="true" />
        <el-table-column label="验收操作人" align="center" prop="operator" width="100" />
        <el-table-column label="验收日期" align="center" width="120">
          <template #default="scope">
            <span>{{ parseTime(scope.row.acceptanceDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="90">
          <template #default="scope">
            <dict-tag :options="statusOptions" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="当前审批人" align="center" prop="currentApprover" width="110" :show-overflow-tooltip="true">
          <template #default="scope">
            <span>{{ scope.row.currentApprover || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="170">
          <template #default="scope">
            <span>{{ proxy.parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip v-if="!scope.row.processInstanceId" content="提交" placement="top">
              <el-button v-hasPermi="['procurement:acceptance:submit']" link type="primary" icon="Promotion" @click="handleSubmit(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip v-if="!scope.row.processInstanceId" content="修改" placement="top">
              <el-button v-hasPermi="['procurement:acceptance:edit']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)"></el-button>
            </el-tooltip>
            <el-tooltip v-if="!scope.row.processInstanceId" content="删除" placement="top">
              <el-button v-hasPermi="['procurement:acceptance:remove']" link type="primary" icon="Delete" @click="handleDelete(scope.row)"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 添加或修改采购验收对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="1100px" append-to-body>
      <el-form ref="acceptanceFormRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="关联采购申请" prop="requestId">
              <el-select v-model="form.requestId" placeholder="请选择已审批采购申请" clearable style="width: 100%" :disabled="form.id !== undefined" @change="onRequestChange">
                <el-option v-for="item in requestOptions" :key="item.id" :label="item.title || item.requestCode" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目">
              <el-input :model-value="form.projectName" placeholder="选择采购申请后自动带出" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="验收操作人" prop="operator">
              <el-input v-model="form.operator" placeholder="自动带出当前登录用户" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="验收日期" prop="acceptanceDate">
              <el-date-picker v-model="form.acceptanceDate" value-format="YYYY-MM-DD" type="date" placeholder="选择验收日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" maxlength="500" />
        </el-form-item>
      </el-form>

      <el-card shadow="never" class="mt-2">
        <template #header>
          <div class="card-header">
            <span>验收明细</span>
            <div class="card-header-actions">
              <el-alert type="info" :closable="false" show-icon class="inline-alert">
                <template #title>填写发票金额后系统自动核对：不超过申请单价显示「通过」，超出显示「冲红」；实物图片、发票附件每行必填</template>
              </el-alert>
              <el-button type="primary" plain icon="MagicStick" @click="openAiMatch">AI 识别发票</el-button>
            </div>
          </div>
        </template>
        <el-table :data="form.items" border size="small">
          <el-table-column label="品名" align="center" prop="itemName" min-width="120" :show-overflow-tooltip="true" />
          <el-table-column label="规格" align="center" prop="spec" min-width="90" :show-overflow-tooltip="true" />
          <el-table-column label="申请单价" align="center" width="100">
            <template #default="scope"><span>{{ (Number(scope.row.applyPrice) || 0).toFixed(2) }}</span></template>
          </el-table-column>
          <el-table-column label="发票金额" align="center" width="130">
            <template #default="scope">
              <el-input-number v-model="scope.row.invoicePrice" :min="0" :precision="2" :controls="false" placeholder="发票金额" style="width: 100%" @change="calcPriceCheck(scope.$index)" />
            </template>
          </el-table-column>
          <el-table-column label="金额核对" align="center" width="90">
            <template #default="scope">
              <el-tag :type="scope.row.priceCheck === 'red' ? 'danger' : (scope.row.priceCheck === 'over' ? 'warning' : 'success')">
                {{ scope.row.priceCheck === 'red' ? '冲红' : (scope.row.priceCheck === 'over' ? '超标' : '通过') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="实物图片" align="center" width="140">
            <template #default="scope">
              <ImageUpload v-model="scope.row.photoUrl" :limit="1" />
            </template>
          </el-table-column>
          <el-table-column label="发票附件" align="center" width="140">
            <template #default="scope">
              <FileUpload v-model="scope.row.invoiceUrl" :limit="1" :file-type="['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg']" />
            </template>
          </el-table-column>
          <el-table-column label="备注" align="center" min-width="120">
            <template #default="scope">
              <el-input v-model="scope.row.remark" placeholder="备注" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" plain @click="submitDraft">保 存 草 稿</el-button>
          <el-button type="success" @click="handleSubmitFlow">提 交</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- AI 批量识别发票对话框 -->
    <el-dialog v-model="aiDialog.visible" title="AI 批量识别发票" width="720px" append-to-body :close-on-click-modal="false">
      <el-alert type="info" :closable="false" show-icon class="mb-2">
        <template #title>上传多张发票 PDF（可一次多张，也可分多轮补充）。系统自动识别票面字段并按商品名匹配，匹配成功的自动填「发票金额(不含税)」并保存发票附件；冲红票会标记「冲红」；不相干的发票不会自动上传。</template>
      </el-alert>
      <el-alert v-if="missingInvoiceCount > 0" type="warning" :closable="false" show-icon class="mb-2">
        <template #title>补齐材料：当前还有 {{ missingInvoiceCount }} 个商品缺少发票。本轮只需拖入缺口发票，已识别的不会重复处理。</template>
      </el-alert>
      <div class="mb-2">
        <el-upload
          ref="aiUploadRef"
          multiple
          drag
          :auto-upload="false"
          :limit="20"
          :file-type="['pdf']"
          accept=".pdf"
          v-model:file-list="aiDialog.fileList"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">将发票 PDF 拖到此处，或<em>点击选择</em></div>
          <template #tip>
            <div class="el-upload__tip">仅支持 PDF，可一次多张；每轮识别后队列自动清空</div>
          </template>
        </el-upload>
      </div>

      <div v-if="aiRounds.length > 0" class="ai-rounds mb-2">
        <div class="ai-report-title">历史识别记录（共 {{ aiRounds.length }} 轮）</div>
        <el-collapse>
          <el-collapse-item v-for="(r, i) in aiRounds" :key="r.round" :name="r.round" :title="`第 ${r.round} 轮 · ${r.time} · ${r.files.length} 个文件`">
            <div v-for="(line, li) in r.lines" :key="li" class="ai-round-line"
              :class="line.includes('✅') ? 'line-success' : (line.includes('❌') ? 'line-error' : 'line-warning')">{{ line }}</div>
          </el-collapse-item>
        </el-collapse>
      </div>

      <div v-if="aiDialog.report && aiDialog.report.lines" class="ai-report">
        <div class="ai-report-title">本轮识别结果</div>
        <el-alert v-for="(line, i) in aiDialog.report.lines" :key="i" :closable="false" show-icon class="mb-1"
          :type="line.includes('✅') ? 'success' : (line.includes('❌') ? 'error' : 'warning')">
          <template #title>{{ line }}</template>
        </el-alert>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="aiDialog.loading" @click="startAiMatch">
            {{ missingInvoiceCount > 0 ? '开始识别（补齐材料）' : '开始识别' }}
          </el-button>
          <el-button @click="aiDialog.visible = false; aiDialog.fileList = []; aiDialog.report = null">关 闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ProcurementAcceptance" lang="ts">
import { listAcceptance, getAcceptance, delAcceptance, addAcceptance, updateAcceptance, exportAcceptance, acceptableRequestList, submitAcceptance, aiInvoiceMatch } from '@/api/procurement/acceptance';
import { AcceptanceForm, AcceptanceQuery, AcceptanceItemForm, AcceptanceVO } from '@/api/procurement/acceptance/types';
import { getRequest } from '@/api/procurement/request';
import { treeProject } from '@/api/procurement/project';
import { UploadUserFile } from 'element-plus';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const acceptanceList = ref<AcceptanceVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const requestOptions = ref<any[]>([]);
const projectOptions = ref<any[]>([]);

const statusOptions = ref([
  { label: '待验收', value: 'pending', elTagType: 'info' },
  { label: '部分验收', value: 'partial', elTagType: 'warning' },
  { label: '已完成', value: 'finished', elTagType: 'success' },
  { label: '不合格', value: 'rejected', elTagType: 'danger' },
  { label: '待审核', value: 'waiting', elTagType: '' },
  { label: '已退回', value: 'back', elTagType: 'danger' }
]);

const queryFormRef = ref<ElFormInstance>();
const acceptanceFormRef = ref<ElFormInstance>();
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const aiDialog = reactive<{
  visible: boolean;
  loading: boolean;
  fileList: UploadUserFile[];
  report: { lines: string[] } | null;
}>({
  visible: false,
  loading: false,
  fileList: [],
  report: null
});

const emptyItem = (): AcceptanceItemForm => ({
  id: undefined,
  acceptanceId: undefined,
  sourceItemId: undefined,
  itemName: '',
  spec: '',
  applyPrice: undefined,
  invoicePrice: undefined,
  priceCheck: 'pass',
  photoUrl: '',
  invoiceUrl: '',
  result: 'pass',
  remark: ''
});

const initFormData: AcceptanceForm = {
  id: undefined,
  acceptanceCode: '',
  requestId: undefined,
  projectId: undefined,
  projectName: '',
  operator: '',
  acceptanceDate: '',
  status: 'pending',
  remark: '',
  aiDetail: '',
  items: []
};

const data = reactive<PageData<AcceptanceForm, AcceptanceQuery>>({
  form: JSON.parse(JSON.stringify(initFormData)),
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    acceptanceCode: '',
    requestId: undefined,
    projectId: undefined,
    status: ''
  },
  rules: {
    requestId: [{ required: true, message: '请选择关联采购申请', trigger: 'change' }],
    operator: [{ required: false }],
    acceptanceDate: [{ required: true, message: '验收日期不能为空', trigger: 'change' }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询采购验收列表 */
const getList = async () => {
  loading.value = true;
  const res = await listAcceptance(queryParams.value);
  acceptanceList.value = res.data.rows;
  total.value = res.data.total;
  loading.value = false;
};

/** 加载可验收申请列表 + 项目列表 */
const loadOptions = async () => {
  const [requestRes, projectRes] = await Promise.all([
    acceptableRequestList(),
    treeProject()
  ]);
  requestOptions.value = requestRes.data || [];
  projectOptions.value = projectRes.data || [];
};

/** 选择采购申请：带出项目与验收明细行 */
const onRequestChange = async (val: number | string | undefined) => {
  form.value.items = [];
  form.value.projectId = undefined;
  form.value.projectName = '';
  if (!val) return;
  const req = requestOptions.value.find((item) => item.id === val);
  if (req) {
    form.value.projectId = req.projectId;
    form.value.projectName = req.projectName || '';
  }
  const res = await getRequest(val);
  const rows: AcceptanceItemForm[] = (res.data.items || []).map((it: any) => ({
    ...emptyItem(),
    sourceItemId: it.id,
    itemName: it.itemName || '',
    spec: it.spec || '',
    applyPrice: Number(it.unitPrice) || 0
  }));
  form.value.items = rows;
};

/** 打开 AI 识别发票对话框 */
const openAiMatch = () => {
  if (!form.value.items || form.value.items.length === 0) {
    proxy?.$modal.msgError('请先选择关联采购申请，带出验收明细');
    return;
  }
  aiDialog.visible = true;
  // 每次打开都清空文件队列，避免上一轮残留文件被重复识别
  aiDialog.fileList = [];
  // 有历史轮次时先展示最新一轮
  const rounds = parseAiRounds(form.value.aiDetail);
  aiDialog.report = rounds.length > 0 ? { lines: rounds[rounds.length - 1].lines || [] } : null;
};

/** 解析验收单 aiDetail（JSON 数组）为轮次列表 */
const parseAiRounds = (detail?: string): any[] => {
  if (!detail) return [];
  try {
    const arr = JSON.parse(detail);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

/** 缺口明细数（未填发票金额的行数） */
const missingInvoiceCount = computed(() =>
  (form.value.items || []).filter((it: AcceptanceItemForm) => it.invoicePrice === undefined || it.invoicePrice === null).length
);

/** AI 轮次列表（倒序，最新在前） */
const aiRounds = computed(() => parseAiRounds(form.value.aiDetail).slice().reverse());

/** 开始 AI 识别 + 匹配 + 持久化（支持多轮：只传尚未填发票金额的明细，已填的不重复处理） */
const startAiMatch = async () => {
  const files = aiDialog.fileList.filter((f) => f.raw).map((f) => f.raw as File);
  if (files.length === 0) {
    proxy?.$modal.msgError('请先选择发票 PDF 文件');
    return;
  }
  // 只把「尚未填发票金额」的明细送匹配，已填的视为已处理（支持多轮补充上传）
  const pendingItems = (form.value.items || []).filter(
    (it: AcceptanceItemForm) => it.invoicePrice === undefined || it.invoicePrice === null
  );
  if (pendingItems.length === 0) {
    proxy?.$modal.msgError('所有明细都已填写发票金额，无需再识别');
    return;
  }
  const items = pendingItems.map((it: AcceptanceItemForm) => ({
    id: it.sourceItemId ?? it.id,
    itemName: it.itemName,
    spec: it.spec,
    applyPrice: Number(it.applyPrice) || 0,
    quantity: 1
  }));

  aiDialog.loading = true;
  aiDialog.report = null;
  try {
    const res = await aiInvoiceMatch(items, files, form.value.id, form.value.requestId);
    const data = res.data || res;
    const results: any[] = data.results || [];
    for (let idx = 0; idx < results.length; idx++) {
      const r = results[idx];
      // 后端已做 OSS 上传并持久化发票台账；前端直接用返回的 ossId 回填 invoiceUrl
      const ossId = r.ossId || '';
      const isRed = !!r.extracted?.is_red_invoice;

      if (r.matchStatus === 'matched' && r.matchedItemIds && r.matchedItemIds.length > 0) {
        const matchedIds = new Set(r.matchedItemIds.map(String));
        const unitPrices: Record<string, number> = r.matchedUnitPrices || {};
        const checks: Record<string, string> = {};
        (r.amountCheck?.items || []).forEach((c: any) => { checks[String(c.itemId)] = c.status; });
        const targetRows = (form.value.items || []).filter((it: AcceptanceItemForm) =>
          matchedIds.has(String(it.sourceItemId ?? it.id))
        );
        for (const row of targetRows) {
          const rowId = String(row.sourceItemId ?? row.id);
          const unitPrice = unitPrices[rowId];
          if (unitPrice !== undefined && unitPrice !== null) {
            row.invoicePrice = Number(unitPrice);
          }
          if (ossId) row.invoiceUrl = ossId;
          if (isRed) {
            row.priceCheck = 'red';
          } else {
            const st = checks[rowId];
            row.priceCheck = st === 'amount_exceed' ? 'over' : 'pass';
          }
          row.result = row.priceCheck;
        }
      }
    }
    aiDialog.report = { lines: data.summary?.lines || [] };
    // 留痕：本轮识别结果追加进验收单 aiDetail，随表单保存持久化
    const round = {
      round: parseAiRounds(form.value.aiDetail).length + 1,
      time: proxy?.parseTime(new Date()) || '',
      files: files.map((f) => f.name),
      lines: data.summary?.lines || []
    };
    const rounds = parseAiRounds(form.value.aiDetail);
    rounds.push(round);
    form.value.aiDetail = JSON.stringify(rounds);
    // 识别成功后清空本轮文件队列，下一轮只装新拖入的补齐文件
    aiDialog.fileList = [];
    proxy?.$modal.msgSuccess(`识别完成：匹配 ${data.summary?.matchedInvoiceCount ?? 0} 张发票`);
  } catch (e: any) {
    proxy?.$modal.msgError('AI 识别失败：' + (e?.message || '请稍后重试'));
  } finally {
    aiDialog.loading = false;
  }
};

/** 自动核对（不含税口径）：负数=冲红(red)，发票金额>申请金额=超标(over)，否则通过(pass) */
const calcPriceCheck = (index: number) => {
  const row = form.value.items[index];
  if (!row) return;
  const invoice = Number(row.invoicePrice);
  const apply = Number(row.applyPrice) || 0;
  if (Number.isFinite(invoice) && invoice < 0) {
    row.priceCheck = 'red';      // 红字/冲红发票
  } else if (Number.isFinite(invoice) && invoice > apply) {
    row.priceCheck = 'over';     // 超标
  } else {
    row.priceCheck = 'pass';
  }
  row.result = row.priceCheck;
};

/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
};

/** 表单重置 */
const reset = () => {
  form.value = JSON.parse(JSON.stringify(initFormData));
  acceptanceFormRef.value?.resetFields();
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
const handleSelectionChange = (selection: AcceptanceVO[]) => {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
};

/** 新增按钮操作 */
const handleAdd = () => {
  reset();
  loadOptions();
  dialog.visible = true;
  dialog.title = '添加采购验收';
};

/** 修改按钮操作 */
const handleUpdate = async (row?: AcceptanceVO) => {
  reset();
  loadOptions();
  const id = row?.id || ids.value[0];
  const res = await getAcceptance(id);
  form.value = { ...JSON.parse(JSON.stringify(initFormData)), ...res.data };
  form.value.items = (res.data.items || []).map((it: any) => ({ ...emptyItem(), ...it }));
  dialog.visible = true;
  dialog.title = '修改采购验收';
};

/** 明细业务校验：每行发票金额、实物图片、发票附件必填 */
const validateItems = (): boolean => {
  if (!form.value.items || form.value.items.length === 0) {
    proxy?.$modal.msgError('请先选择关联采购申请，带出验收明细');
    return false;
  }
  for (let i = 0; i < form.value.items.length; i++) {
    const item = form.value.items[i];
    if (item.invoicePrice === undefined || item.invoicePrice === null) {
      proxy?.$modal.msgError('第 ' + (i + 1) + ' 行：请填写发票金额');
      return false;
    }
    if (!item.photoUrl) {
      proxy?.$modal.msgError('第 ' + (i + 1) + ' 行：请上传实物图片');
      return false;
    }
    if (!item.invoiceUrl) {
      proxy?.$modal.msgError('第 ' + (i + 1) + ' 行：请上传发票附件');
      return false;
    }
  }
  return true;
};

/** 提交验收（发起流程） */
const handleSubmitFlow = () => {
  acceptanceFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    if (!validateItems()) return;
    await submitAcceptance(form.value);
    proxy?.$modal.msgSuccess('提交成功，已进入审批流程');
    dialog.visible = false;
    await getList();
  });
};

/** 列表行：提交已有验收单（拉取详情后提交，带上明细） */
const handleSubmit = async (row: AcceptanceVO) => {
  const res = await getAcceptance(row.id);
  const full = { ...JSON.parse(JSON.stringify(initFormData)), ...res.data };
  full.items = (res.data.items || []).map((it: any) => ({ ...emptyItem(), ...it }));
  await proxy?.$modal.confirm('是否确认提交验收单「' + (row.acceptanceCode || row.id) + '」进入审批流程？');
  await submitAcceptance(full);
  proxy?.$modal.msgSuccess('提交成功，已进入审批流程');
  await getList();
};

/** 保存草稿（不校验必填，直接存库） */
const submitDraft = async () => {
  form.value.id ? await updateAcceptance(form.value) : await addAcceptance(form.value);
  proxy?.$modal.msgSuccess('保存成功');
  dialog.visible = false;
  await getList();
};

/** 删除按钮操作 */
const handleDelete = async (row?: AcceptanceVO) => {
  const idList = row?.id || ids.value;
  await proxy?.$modal.confirm('是否确认删除验收编号为"' + idList + '"的数据项？');
  await delAcceptance(idList);
  await getList();
  proxy?.$modal.msgSuccess('删除成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download('procurement/acceptance/export', queryParams.value, `acceptance_${new Date().getTime()}.xlsx`);
};

onMounted(() => {
  getList();
  loadOptions();
});
// keep-alive 缓存下切回页面重新刷新，避免新建申请/项目后选项过期
onActivated(() => {
  getList();
  loadOptions();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.card-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: space-between;
}
.inline-alert {
  flex: 1;
  max-width: 720px;
}
.ai-report {
  margin-top: 8px;
  max-height: 260px;
  overflow-y: auto;
}
.ai-report-title {
  font-weight: 600;
  margin-bottom: 6px;
}
.ai-round-line {
  padding: 2px 0;
  font-size: 13px;
}
.line-success {
  color: var(--el-color-success);
}
.line-error {
  color: var(--el-color-danger);
}
.line-warning {
  color: var(--el-color-warning);
}
.mb-2 {
  margin-bottom: 12px;
}
.mb-1 {
  margin-bottom: 4px;
}
</style>
