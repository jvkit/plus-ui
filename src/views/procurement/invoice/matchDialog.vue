<template>
  <div>
  <!-- 发票匹配台弹窗：台账页与发票上传工作台共用 -->
  <el-dialog v-model="dialogVisible" title="发票匹配台" width="1200px" append-to-body :close-on-click-modal="false" :before-close="beforeCloseUpload">
    <!-- 顶部：关联申请 + 完成度 -->
    <div class="match-top">
      <el-select v-model="uploadDialog.requestId" placeholder="请选择已验收完成的采购申请" filterable clearable style="flex: 1" @change="onUploadRequestChange">
        <el-option v-for="item in acceptedRequests" :key="item.id" :label="requestOptionLabel(item)" :value="item.id" />
      </el-select>
      <el-tag type="primary" effect="plain" class="match-progress">已挂载 {{ mountedCount }}/{{ uploadDialog.items.length }} 条明细</el-tag>
    </div>

    <!-- 上传区：选文件 → AI 识别匹配 -->
    <div class="match-upload">
      <el-upload multiple drag :auto-upload="false" :limit="20" accept=".pdf" v-model:file-list="uploadDialog.fileList">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将发票 PDF 拖到此处，或<em>点击选择</em></div>
        <template #tip>
          <div class="el-upload__tip">仅支持 PDF，可一次多张；识别完成后把右侧发票卡片拖到左侧明细行即可挂载</div>
        </template>
      </el-upload>
      <div class="match-upload-actions">
        <el-button type="primary" icon="MagicStick" :loading="uploadDialog.loading" :disabled="!uploadDialog.requestId" @click="startAiMatch">开始识别（AI匹配）</el-button>
        <span v-if="!uploadDialog.requestId" class="text-xs text-gray-400">请先选择关联申请</span>
        <span v-else-if="uploadDialog.fileList.length" class="text-xs text-gray-400">待识别 {{ uploadDialog.fileList.length }} 张</span>
      </div>
      <div v-if="uploadDialog.report && uploadDialog.report.length" class="ai-report">
        <div class="ai-report-head" @click="uploadDialog.reportOpen = !uploadDialog.reportOpen">
          <span class="ai-report-title">本轮识别结果（{{ uploadDialog.report.length }} 条）</span>
          <el-icon><arrow-up v-if="uploadDialog.reportOpen" /><arrow-down v-else /></el-icon>
        </div>
        <div v-show="uploadDialog.reportOpen">
          <el-alert v-for="(line, i) in uploadDialog.report" :key="i" :closable="false" show-icon class="mb-1"
            :type="line.includes('✅') ? 'success' : (line.includes('❌') ? 'error' : 'warning')">
            <template #title>{{ line }}</template>
          </el-alert>
        </div>
      </div>
    </div>

    <!-- 主体双栏：左商品明细 / 右发票池 -->
    <div v-loading="uploadDialog.poolLoading" class="match-body">
      <div class="match-left">
        <div class="panel-title">商品明细</div>
        <el-empty v-if="!uploadDialog.items.length" description="请先选择关联申请" :image-size="60" />
        <div v-for="(it, idx) in uploadDialog.items" :key="it.id" class="item-card">
          <div class="item-info">
            <span class="item-idx">{{ idx + 1 }}</span>
            <div class="item-main">
              <div class="item-name">{{ it.itemName }}</div>
              <div class="item-sub">{{ it.spec || '-' }} ｜ 申请价 ¥{{ it.applyPrice ?? '-' }}</div>
            </div>
            <span class="item-count">{{ invoicesOfItem(it.id).length }} 张</span>
          </div>
          <!-- 发票挂载槽（拖放目标） -->
          <div class="mount-slot" :class="{ 'drag-over': String(uploadDialog.dragOverItemId) === String(it.id) }"
            @dragenter.prevent="uploadDialog.dragOverItemId = it.id"
            @dragover.prevent
            @dragleave="onSlotDragLeave(it)"
            @drop.prevent="dropOnItem(it)">
            <div v-for="inv in invoicesOfItem(it.id)" :key="inv.id" class="slot-invoice" @click="previewPdf(inv)">
              <el-icon><document /></el-icon>
              <span>{{ inv.invoiceNumber || '未识别号码' }}</span>
              <span>¥{{ inv.totalAmount ?? '-' }}</span>
            </div>
            <span v-if="!invoicesOfItem(it.id).length" class="slot-tip">拖发票到此挂载</span>
            <el-upload class="slot-upload" :auto-upload="false" :show-file-list="false" accept=".pdf" :on-change="(f) => uploadToItem(f, it)">
              <el-button link type="primary" size="small" icon="Upload">直接上传</el-button>
            </el-upload>
          </div>
        </div>
      </div>

      <div class="match-right">
        <div class="panel-title">发票池</div>
        <div class="pool-list">
          <el-empty v-if="!uploadDialog.invoices.length" description="该申请下暂无发票，可先上传识别" :image-size="60" />
          <!-- 发票卡片（可拖拽，触屏用右上角 ⋯ 菜单） -->
          <div v-for="inv in uploadDialog.invoices" :key="inv.id" class="invoice-card" :draggable="true"
            @dragstart="onInvoiceDragStart(inv, $event)" @dragend="onInvoiceDragEnd" @click="previewPdf(inv)">
            <div class="invoice-card-head">
              <el-icon class="pdf-icon"><document /></el-icon>
              <span class="invoice-no">{{ inv.invoiceNumber || '未识别号码' }}</span>
              <el-dropdown trigger="click" class="invoice-menu" @command="(cmd) => onInvoiceCommand(cmd, inv)" @click.stop>
                <el-button link icon="MoreFilled" @click.stop />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="preview">预览 PDF</el-dropdown-item>
                    <el-dropdown-item command="move" :disabled="!uploadDialog.items.length">移动到…</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="invoice-card-body">
              <span>价税合计 ¥{{ inv.totalAmount ?? '-' }}</span>
              <span>{{ parseDate(inv.invoiceDate) }}</span>
            </div>
            <div class="invoice-card-tags">
              <el-tooltip v-if="inv.validFlag === 0" :content="inv.invalidReason || '无效发票'" placement="top">
                <el-tag type="danger" size="small">无效</el-tag>
              </el-tooltip>
              <el-tag v-else type="success" size="small">有效</el-tag>
              <el-tag v-if="inv.redFlag === 1" type="warning" size="small">冲红</el-tag>
              <el-tag :type="inv.acceptanceItemId ? 'primary' : 'info'" size="small" effect="plain">{{ inv.acceptanceItemId ? '已挂载' : '未匹配' }}</el-tag>
            </div>
          </div>
        </div>
        <!-- 删除区（拖放目标） -->
        <div class="delete-zone" :class="{ 'drag-over': uploadDialog.dragOverDelete }"
          @dragenter.prevent="uploadDialog.dragOverDelete = true"
          @dragover.prevent
          @dragleave="uploadDialog.dragOverDelete = false"
          @drop.prevent="dropOnDelete">
          <el-icon><delete /></el-icon>
          <span>拖到此处删除发票</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeUpload">关 闭</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 移动到…弹窗（触屏兜底） -->
  <el-dialog v-model="moveDialog.visible" title="挂载到商品明细" width="480px" append-to-body>
    <el-select v-model="moveDialog.itemId" placeholder="请选择商品明细" filterable style="width: 100%">
      <el-option v-for="it in uploadDialog.items" :key="it.id" :label="it.itemName + (it.spec ? '（' + it.spec + '）' : '')" :value="it.id" />
    </el-select>
    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" @click="confirmMove">确 定</el-button>
        <el-button @click="moveDialog.visible = false">取 消</el-button>
      </div>
    </template>
  </el-dialog>

  <!-- PDF 预览弹窗 -->
  <el-dialog v-model="pdfDialog.visible" title="发票 PDF 预览" width="900px" append-to-body>
    <iframe v-if="pdfDialog.url" :src="pdfDialog.url" style="width: 100%; height: 70vh; border: none"></iframe>
  </el-dialog>
  </div>
</template>

<script setup name="InvoiceMatchDialog" lang="ts">
import { delProcurementInvoice, manualUploadInvoice } from '@/api/procurement/invoice';
import { ProcurementInvoiceVO } from '@/api/procurement/invoice/types';
import { listAcceptance, getAcceptance } from '@/api/procurement/acceptance';
import { getRequest } from '@/api/procurement/request';
import { reimbursableRequestList } from '@/api/procurement/reimbursement';
import request from '@/utils/request';
import { UploadFile, UploadUserFile } from 'element-plus';

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const props = defineProps<{
  visible: boolean;
  /** 初始选中的关联申请（可选） */
  requestId?: number | string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void;
  /** 发票数据变化后通知父页面刷新自己的列表 */
  (e: 'refresh'): void;
}>();

/** 弹窗显隐：v-model:visible */
const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val)
});

/** 发票池行：在台账 VO 基础上补充挂载字段 */
interface PoolInvoice extends ProcurementInvoiceVO {
  acceptanceItemId?: string | number;
}

const acceptedRequests = ref<any[]>([]);

const pdfDialog = reactive({
  visible: false,
  url: ''
});

const uploadDialog = reactive<{
  requestId: number | string | undefined;
  acceptanceId: number | string | undefined;
  items: any[];
  invoices: PoolInvoice[];
  fileList: UploadUserFile[];
  report: string[] | null;
  reportOpen: boolean;
  loading: boolean;
  poolLoading: boolean;
  dragOverItemId: number | string | undefined;
  dragOverDelete: boolean;
}>({
  requestId: undefined,
  acceptanceId: undefined,
  items: [],
  invoices: [],
  fileList: [],
  report: null,
  reportOpen: false,
  loading: false,
  poolLoading: false,
  dragOverItemId: undefined,
  dragOverDelete: false
});

/** 移动到…弹窗（触屏兜底） */
const moveDialog = reactive<{
  visible: boolean;
  invoice: PoolInvoice | null;
  itemId: number | string | undefined;
}>({
  visible: false,
  invoice: null,
  itemId: undefined
});

/** 当前拖拽中的发票 id（dragstart 记录，drop 消费） */
const draggingInvoiceId = ref<string | number | null>(null);
/** 自绘拖拽 ghost 节点 */
let dragGhostEl: HTMLElement | null = null;

/** 日期格式化：兼容 ISO 带时区串（如 2026-01-21T00:00:00.000+08:00） */
const parseDate = (val?: string) => {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val).slice(0, 10);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** 关联申请下拉选项显示：编号（标题） */
const requestOptionLabel = (item: any) => (item.requestCode || '') + (item.title ? '（' + item.title + '）' : '');

/** 加载已验收完成的申请列表（弹窗内部数据源） */
const loadAcceptedRequests = async () => {
  if (acceptedRequests.value.length > 0) return;
  const res = await reimbursableRequestList();
  acceptedRequests.value = res.data || [];
};

/** 预选/筛选的申请不在下拉列表中时补一个兜底选项，保证能正常回显 */
const ensureRequestOption = async (id: number | string) => {
  if (!acceptedRequests.value.some((r: any) => String(r.id) === String(id))) {
    // 不在下拉数据源时拉申请详情补一个真实选项，避免回显成"当前申请"
    let req: any = null;
    try {
      const res: any = await getRequest(id);
      req = res.data;
    } catch {
      req = null;
    }
    acceptedRequests.value.unshift({
      id,
      requestCode: req?.requestCode || '当前申请',
      title: req?.title || ''
    });
  }
};

/** PDF 预览：优先用 pdfUrl，否则用 pdfOssId 调接口取 URL */
const previewPdf = async (row: ProcurementInvoiceVO) => {
  if (row.pdfUrl) {
    pdfDialog.url = row.pdfUrl;
    pdfDialog.visible = true;
    return;
  }
  if (row.pdfOssId) {
    const res = await request({
      url: '/system/oss/' + row.pdfOssId,
      method: 'get'
    });
    pdfDialog.url = res.data.url || '';
    pdfDialog.visible = true;
  }
};

/** 完成度：已挂载（至少一张发票挂到该明细行）的明细条数 */
const mountedCount = computed(() => {
  const mountedIds = new Set(
    uploadDialog.invoices.filter((i) => i.acceptanceItemId != null && i.acceptanceItemId !== '').map((i) => String(i.acceptanceItemId))
  );
  return uploadDialog.items.filter((it) => mountedIds.has(String(it.id))).length;
});

/** 某条明细下已挂载的发票 */
const invoicesOfItem = (itemId: number | string) =>
  uploadDialog.invoices.filter((i) => i.acceptanceItemId != null && String(i.acceptanceItemId) === String(itemId));

/** 加载该申请下全部发票（发票池） */
const loadInvoicePool = async () => {
  if (!uploadDialog.requestId) {
    uploadDialog.invoices = [];
    return;
  }
  uploadDialog.poolLoading = true;
  try {
    const res: any = await request({
      url: '/procurement/invoice/list',
      method: 'get',
      params: { requestId: uploadDialog.requestId, pageSize: 999 }
    });
    uploadDialog.invoices = res.data?.rows ?? [];
  } finally {
    uploadDialog.poolLoading = false;
  }
};

/** 刷新发票池，并通知父页面刷新列表（挂载/删除等操作后调用） */
const refreshPoolAndList = async () => {
  await loadInvoicePool();
  emit('refresh');
};

/** 打开发票匹配台（可预选关联申请，自动带出验收明细与发票池） */
const openUpload = async (requestId?: number | string) => {
  uploadDialog.requestId = undefined;
  uploadDialog.acceptanceId = undefined;
  uploadDialog.items = [];
  uploadDialog.invoices = [];
  uploadDialog.fileList = [];
  uploadDialog.report = null;
  uploadDialog.reportOpen = false;
  await loadAcceptedRequests();
  if (requestId) {
    uploadDialog.requestId = requestId;
    await ensureRequestOption(requestId);
    await onUploadRequestChange(requestId);
  }
};

// 弹窗打开时初始化（含路由/工作台带进来的 requestId）
watch(
  () => props.visible,
  (val) => {
    if (val) openUpload(props.requestId);
  }
);

// 弹窗已打开时切换 requestId（工作台连续点不同行）
watch(
  () => props.requestId,
  async (val) => {
    if (props.visible && val != null && String(val) !== String(uploadDialog.requestId)) {
      uploadDialog.requestId = val;
      await ensureRequestOption(val);
      await onUploadRequestChange(val);
    }
  }
);

/** 选择关联申请：查该申请下最新已验收完成单带出明细，并重载发票池（顶部切换时清空重载） */
const onUploadRequestChange = async (val: number | string | undefined) => {
  uploadDialog.items = [];
  uploadDialog.invoices = [];
  uploadDialog.acceptanceId = undefined;
  uploadDialog.report = null;
  if (!val) return;
  const res: any = await listAcceptance({ requestId: val, pageNum: 1, pageSize: 20, acceptanceCode: '', projectId: undefined, status: '' });
  const rows: any[] = res.data?.rows || res.data || [];
  const finished = rows.filter((r) => r.status === 'finish');
  const target = finished[0] || rows[0];
  if (!target) return;
  uploadDialog.acceptanceId = target.id;
  // 列表接口不带明细，需取详情
  const detail: any = await getAcceptance(target.id);
  uploadDialog.items = detail.data?.items || [];
  await loadInvoicePool();
};

/** 关闭前拦截：仅 AI 识别仍在进行时需确认 */
const beforeCloseUpload = (done: () => void) => {
  if (uploadDialog.loading) {
    proxy?.$modal
      .confirm('AI 识别仍在进行，关闭后结果仍会写入台账，可稍后重新打开查看')
      .then(() => done())
      .catch(() => {});
  } else {
    done();
  }
};

/** 关闭发票匹配台 */
const closeUpload = () => {
  beforeCloseUpload(() => {
    dialogVisible.value = false;
    uploadDialog.fileList = [];
    uploadDialog.report = null;
  });
};

/** AI 一键匹配：复用验收模块的 AI 识别端点 */
const startAiMatch = async () => {
  const files = uploadDialog.fileList.filter((f) => f.raw).map((f) => f.raw as File);
  if (files.length === 0) {
    proxy?.$modal.msgError('请先选择发票 PDF 文件');
    return;
  }
  if (!uploadDialog.requestId) {
    proxy?.$modal.msgError('请先选择关联申请');
    return;
  }
  const items = (uploadDialog.items || []).map((it: any) => ({
    id: it.sourceItemId ?? it.id,
    itemName: it.itemName,
    spec: it.spec,
    applyPrice: Number(it.applyPrice) || 0,
    quantity: 1
  }));
  // 点击后立即清空待传队列，避免识别期间队列叠加导致重复上传
  uploadDialog.fileList = [];
  uploadDialog.loading = true;
  uploadDialog.report = null;
  try {
    const formData = new FormData();
    if (uploadDialog.acceptanceId) formData.append('acceptanceId', String(uploadDialog.acceptanceId));
    formData.append('requestId', String(uploadDialog.requestId));
    formData.append('items', JSON.stringify(items));
    files.forEach((f) => formData.append('files', f));
    const res: any = await request({
      url: '/procurement/acceptance/ai-invoice-match',
      method: 'post',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000
    });
    const data = res.data || res;
    uploadDialog.report = data.summary?.lines || [];
    uploadDialog.reportOpen = true;
    proxy?.$modal.msgSuccess(`识别完成：匹配 ${data.summary?.matchedInvoiceCount ?? 0} 张发票`);
    await refreshPoolAndList();
  } catch (e: any) {
    proxy?.$modal.msgError('AI 识别失败：' + (e?.message || '请稍后重试'));
  } finally {
    uploadDialog.loading = false;
  }
};

/** 明细行直接上传（不走 AI 的兜底）：单文件立即登记并挂载到该行 */
const uploadToItem = async (file: UploadFile, item: any) => {
  if (!file.raw) return;
  try {
    await manualUploadInvoice({
      acceptanceId: uploadDialog.acceptanceId,
      requestId: uploadDialog.requestId,
      acceptanceItemId: item.id,
      files: [file.raw]
    });
    proxy?.$modal.msgSuccess('上传成功');
    await refreshPoolAndList();
  } catch (e: any) {
    proxy?.$modal.msgError('上传失败：' + (e?.message || '请稍后重试'));
  }
};

/** 拖拽 ghost 跟随鼠标 */
const moveDragGhost = (e: DragEvent) => {
  if (!dragGhostEl) return;
  dragGhostEl.style.left = e.clientX + 14 + 'px';
  dragGhostEl.style.top = e.clientY + 14 + 'px';
};

/** 发票卡片开始拖拽：记录 id，隐藏默认拖影并挂自绘 ghost */
const onInvoiceDragStart = (inv: PoolInvoice, e: DragEvent) => {
  e.dataTransfer?.setData('text/plain', String(inv.id));
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  draggingInvoiceId.value = inv.id;
  const hideImg = document.createElement('canvas');
  hideImg.width = 1;
  hideImg.height = 1;
  e.dataTransfer?.setDragImage(hideImg, 0, 0);
  dragGhostEl = document.createElement('div');
  dragGhostEl.className = 'invoice-drag-ghost';
  dragGhostEl.textContent = inv.invoiceNumber ? String(inv.invoiceNumber) : '发票';
  document.body.appendChild(dragGhostEl);
  moveDragGhost(e);
  document.addEventListener('dragover', moveDragGhost);
};

/** 拖拽结束：清理 ghost 与高亮 */
const onInvoiceDragEnd = () => {
  draggingInvoiceId.value = null;
  uploadDialog.dragOverItemId = undefined;
  uploadDialog.dragOverDelete = false;
  if (dragGhostEl) {
    dragGhostEl.remove();
    dragGhostEl = null;
  }
  document.removeEventListener('dragover', moveDragGhost);
};

/** 挂载槽 dragleave：仅当离开的是当前高亮行时取消高亮 */
const onSlotDragLeave = (item: any) => {
  if (String(uploadDialog.dragOverItemId) === String(item.id)) {
    uploadDialog.dragOverItemId = undefined;
  }
};

/** 挂载 / 取消挂载（不带 acceptanceItemId 即取消挂载；明细 id 用验收明细行自己的 id） */
const assignInvoice = async (invoiceId: string | number, acceptanceItemId?: string | number) => {
  try {
    await request({
      url: `/procurement/invoice/${invoiceId}/assign`,
      method: 'put',
      params: acceptanceItemId != null ? { acceptanceItemId } : {}
    });
    await refreshPoolAndList();
  } catch (e: any) {
    proxy?.$modal.msgError('操作失败：' + (e?.message || '请稍后重试'));
  }
};

/** 拖到明细行：挂载 / 改挂 */
const dropOnItem = async (item: any) => {
  const invId = draggingInvoiceId.value;
  uploadDialog.dragOverItemId = undefined;
  if (invId == null) return;
  await assignInvoice(invId, item.id);
};

/** 拖回发票池空白处：取消挂载 */
const dropOnPool = async () => {
  const invId = draggingInvoiceId.value;
  if (invId == null) return;
  await assignInvoice(invId);
};

/** 拖到删除区：确认后删除发票记录 */
const dropOnDelete = () => {
  const invId = draggingInvoiceId.value;
  uploadDialog.dragOverDelete = false;
  if (invId == null) return;
  proxy?.$modal
    .confirm('确认删除该发票记录？')
    .then(async () => {
      await delProcurementInvoice(invId);
      proxy?.$modal.msgSuccess('删除成功');
      await refreshPoolAndList();
    })
    .catch(() => {});
};

/** 卡片 ⋯ 菜单（触屏兜底）：预览 / 移动到… / 删除 */
const onInvoiceCommand = (cmd: string, inv: PoolInvoice) => {
  if (cmd === 'preview') {
    previewPdf(inv);
  } else if (cmd === 'move') {
    moveDialog.invoice = inv;
    moveDialog.itemId = undefined;
    moveDialog.visible = true;
  } else if (cmd === 'delete') {
    proxy?.$modal
      .confirm('确认删除该发票记录？')
      .then(async () => {
        await delProcurementInvoice(inv.id);
        proxy?.$modal.msgSuccess('删除成功');
        await refreshPoolAndList();
      })
      .catch(() => {});
  }
};

/** 移动到…：选择商品明细行后挂载 */
const confirmMove = async () => {
  if (!moveDialog.invoice) return;
  if (moveDialog.itemId == null) {
    proxy?.$modal.msgWarning('请选择商品明细');
    return;
  }
  const invoiceId = moveDialog.invoice.id;
  moveDialog.visible = false;
  await assignInvoice(invoiceId, moveDialog.itemId);
};
</script>

<style scoped>
.match-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.match-progress {
  flex-shrink: 0;
}

.match-upload {
  margin-bottom: 12px;
}

.match-upload-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.ai-report {
  margin-top: 8px;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  padding: 8px 10px;
}

.ai-report-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.ai-report-title {
  font-weight: 600;
}

.match-body {
  display: flex;
  gap: 14px;
  height: 440px;
}

.match-left {
  width: 55%;
  overflow-y: auto;
  padding-right: 4px;
}

.match-right {
  width: 45%;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.panel-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.pool-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.item-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
  background: var(--el-fill-color-blank);
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-idx {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  border-radius: 50%;
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  font-size: 12px;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.mount-slot {
  margin-top: 8px;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  padding: 6px 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  transition: border-color 0.15s, background-color 0.15s;
}

.mount-slot.drag-over {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.slot-invoice {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  cursor: pointer;
}

.slot-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.slot-upload {
  margin-left: auto;
}

.invoice-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
  cursor: grab;
  background: var(--el-fill-color-blank);
}

.invoice-card-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pdf-icon {
  color: var(--el-color-danger);
  flex-shrink: 0;
}

.invoice-no {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-menu {
  flex-shrink: 0;
}

.invoice-card-body {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.invoice-card-tags {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}

.delete-zone {
  flex-shrink: 0;
  margin-top: 8px;
  border: 2px dashed var(--el-color-danger);
  border-radius: 6px;
  color: var(--el-color-danger);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 0;
  font-size: 13px;
  transition: background-color 0.15s;
}

.delete-zone.drag-over {
  background: var(--el-color-danger-light-9);
}
</style>

<style>
/* 自绘拖拽 ghost：挂在 body 下，需全局样式 */
.invoice-drag-ghost {
  position: fixed;
  z-index: 4000;
  pointer-events: none;
  padding: 4px 10px;
  background: #fff;
  border: 1px solid var(--el-color-primary);
  border-radius: 4px;
  font-size: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style>
