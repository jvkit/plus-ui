<template>
  <div class="mobile-acceptance-page">
    <!-- 列表页：展示我的验收单（含草稿） -->
    <template v-if="view === 'list'">
      <van-nav-bar title="移动验收" fixed placeholder>
        <template #right>
          <van-button size="small" type="primary" @click="goCreate">新增验收</van-button>
        </template>
      </van-nav-bar>
      <div class="list-container">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadList">
            <div v-for="item in list" :key="item.id" class="acceptance-card" @click="openAcceptance(item)">
              <van-cell-group inset>
                <van-cell :title="item.requestTitle || '未关联申请'" :label="`${item.projectName || '未关联项目'} · ${formatStatus(item.status)}`" clickable>
                  <template #right-icon>
                    <van-tag :type="statusTagType(item.status)">{{ statusActionText(item.status) }}</van-tag>
                  </template>
                </van-cell>
              </van-cell-group>
            </div>
            <van-empty v-if="!loading && list.length === 0" description="暂无验收单，点击右上角新增" />
          </van-list>
        </van-pull-refresh>
      </div>
    </template>

    <!-- 选择采购申请页 -->
    <template v-else-if="view === 'select'">
      <van-nav-bar title="选择采购申请" left-text="返回" left-arrow fixed placeholder @click-left="view = 'list'" />
      <div class="list-container">
        <van-pull-refresh v-model="selectRefreshing" @refresh="onSelectRefresh">
          <van-list v-model:loading="selectLoading" :finished="selectFinished" finished-text="没有更多了" @load="loadSelectList">
            <div v-for="item in selectList" :key="item.id" class="acceptance-card" @click="selectRequest(item)">
              <van-cell-group inset>
                <van-cell :title="item.title" :label="`${item.projectName || '未关联项目'} · ¥${formatMoney(item.amount)}`" clickable>
                  <template #right-icon>
                    <van-tag type="primary">去验收</van-tag>
                  </template>
                </van-cell>
              </van-cell-group>
            </div>
            <van-empty v-if="!selectLoading && selectList.length === 0" description="暂无待验收采购申请" />
          </van-list>
        </van-pull-refresh>
      </div>
    </template>

    <!-- 详情/验收页 -->
    <template v-else>
      <van-nav-bar :title="acceptanceId ? '继续验收' : '验收填报'" left-text="返回" left-arrow fixed placeholder @click-left="view = 'list'" />
      <div class="detail-container">
        <van-cell-group inset class="info-card">
          <van-cell title="申请标题" :value="requestTitle" />
          <van-cell title="项目" :value="projectName || '-'" />
        </van-cell-group>

        <div class="items-title">待验收明细（{{ items.length }}）</div>

        <div v-for="(row, idx) in items" :key="row.id || idx" class="item-card">
          <van-cell-group inset>
            <van-cell :title="row.itemName" :label="`${row.spec || '-'} / 申请单价 ¥${formatMoney(row.applyPrice)}`" />

            <van-field label="发票金额" v-model="row.invoicePrice" type="number" placeholder="请输入发票金额" input-align="right">
              <template #button>元</template>
            </van-field>

            <div class="uploader-row">
              <div class="uploader-label">
                <span class="required">*</span>
                实物拍照
              </div>
              <van-uploader v-model="row.photoFileList" :max-count="3" :after-read="(file) => afterRead(file, row, 'photo')" @delete="(file) => onDelete(file, row, 'photo')" @click-upload="(file) => onFileClick(file, row, 'photo')" />
            </div>

            <div class="uploader-row">
              <div class="uploader-label">发票照片</div>
              <van-uploader v-model="row.invoiceFileList" :max-count="3" :after-read="(file) => afterRead(file, row, 'invoice')" @delete="(file) => onDelete(file, row, 'invoice')" @click-upload="(file) => onFileClick(file, row, 'invoice')" />
            </div>

            <van-field v-model="row.remark" label="备注" type="textarea" rows="1" autosize placeholder="选填" maxlength="200" show-word-limit />
          </van-cell-group>
        </div>

        <div class="submit-area">
          <van-button type="default" round block :loading="savingDraft" @click="saveDraft" style="margin-bottom: 12px;">保存草稿</van-button>
          <van-button type="primary" round block :loading="submitting" @click="submitAcceptance">提交验收</van-button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts" name="MobileAcceptance">
import { ref } from 'vue';
import {
  NavBar,
  PullRefresh,
  List,
  Cell,
  CellGroup,
  Tag,
  Empty,
  Button,
  Field,
  Uploader
} from 'vant';
import {
  showLoadingToast,
  showSuccessToast,
  showFailToast,
  showConfirmDialog,
  closeToast
} from 'vant';
import request from '@/utils/request';
import type { AxiosPromise } from '@/utils/api-types';

// API 封装
const listAcceptanceApi = (params?: any): AxiosPromise<any> => request({ url: '/procurement/acceptance/list', method: 'get', params });
const getAcceptanceApi = (id: string | number): AxiosPromise<any> => request({ url: '/procurement/acceptance/' + id, method: 'get' });
const acceptableListApi = (): AxiosPromise<any[]> => request({ url: '/procurement/request/acceptableList', method: 'get' });
const getRequestApi = (id: string | number): AxiosPromise<any> => request({ url: '/procurement/request/' + id, method: 'get' });
const uploadApi = (file: File): AxiosPromise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  return request({ url: '/resource/oss/upload', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } });
};
const addAcceptanceApi = (data: any): AxiosPromise<any> => request({ url: '/procurement/acceptance', method: 'post', data });
const updateAcceptanceApi = (data: any): AxiosPromise<any> => request({ url: '/procurement/acceptance', method: 'put', data });
const submitAcceptanceApi = (data: any): AxiosPromise<any> => request({ url: '/procurement/acceptance/submit', method: 'post', data });
const ossListByIdsApi = (ossId: string | number): AxiosPromise<any[]> => request({ url: '/resource/oss/listByIds/' + ossId, method: 'get' });

type ViewType = 'list' | 'select' | 'detail';
const view = ref<ViewType>('list');

// 验收单列表
const list = ref<any[]>([]);
const loading = ref(false);
const finished = ref(true);
const refreshing = ref(false);

// 可选采购申请列表
const selectList = ref<any[]>([]);
const selectLoading = ref(false);
const selectFinished = ref(true);
const selectRefreshing = ref(false);

// 当前编辑/提交状态
const acceptanceId = ref<string | number | undefined>(undefined);
const requestId = ref<string | number | undefined>(undefined);
const requestTitle = ref('');
const projectId = ref<string | number | undefined>(undefined);
const projectName = ref('');
const items = ref<any[]>([]);
const submitting = ref(false);
const savingDraft = ref(false);

const formatMoney = (val: any) => Number(val || 0).toFixed(2);

const statusMap: Record<string, string> = {
  pending: '草稿',
  partial: '部分验收',
  finished: '已完成',
  rejected: '不合格',
  waiting: '审批中',
  back: '已退回'
};
const formatStatus = (status?: string) => statusMap[status || ''] || status || '-';

const statusTagType = (status?: string) => {
  switch (status) {
    case 'pending': return 'default';
    case 'waiting': return 'warning';
    case 'finished': return 'success';
    case 'rejected':
    case 'back': return 'danger';
    default: return 'primary';
  }
};

const statusActionText = (status?: string) => {
  if (status === 'pending') return '继续验收';
  if (status === 'waiting') return '审批中';
  if (status === 'finished') return '已完成';
  return '查看';
};

// 加载验收单列表
const loadList = async () => {
  loading.value = true;
  try {
    const res = await listAcceptanceApi({ pageNum: 1, pageSize: 1000 });
    list.value = res.data?.rows || [];
    finished.value = true;
  } catch (e) {
    showFailToast('加载验收单失败');
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const onRefresh = () => {
  finished.value = false;
  loadList();
};

// 进入新增流程：先选采购申请
const goCreate = () => {
  selectList.value = [];
  selectFinished.value = false;
  view.value = 'select';
  loadSelectList();
};

const loadSelectList = async () => {
  selectLoading.value = true;
  try {
    const res = await acceptableListApi();
    selectList.value = res.data || [];
    selectFinished.value = true;
  } catch (e) {
    showFailToast('加载采购申请失败');
  } finally {
    selectLoading.value = false;
    selectRefreshing.value = false;
  }
};

const onSelectRefresh = () => {
  selectFinished.value = false;
  loadSelectList();
};

// 选择一个采购申请，进入新建验收
const selectRequest = async (row: any) => {
  showLoadingToast({ message: '加载中...', forbidClick: true });
  try {
    const res = await getRequestApi(row.id);
    const req = res.data || {};
    resetDetail();
    requestId.value = req.id;
    requestTitle.value = req.title || '';
    projectId.value = req.projectId;
    projectName.value = req.projectName || '';
    items.value = (req.items || []).map((it: any) => ({
      requestItemId: it.id,
      itemName: it.itemName,
      spec: it.spec,
      applyPrice: Number(it.unitPrice) || 0,
      invoicePrice: '',
      photoUrl: '',
      invoiceUrl: '',
      photoFileList: [],
      invoiceFileList: [],
      remark: ''
    }));
    view.value = 'detail';
  } catch (e: any) {
    showFailToast(e?.response?.data?.msg || '加载详情失败');
  } finally {
    closeToast();
  }
};

// 打开已有验收单（草稿/审批中/已完成）
const openAcceptance = async (row: any) => {
  if (!row?.id) return;
  // 只有草稿才允许继续编辑提交
  if (row.status !== 'pending') {
    showFailToast('该验收单当前状态不可编辑');
    return;
  }
  showLoadingToast({ message: '加载中...', forbidClick: true });
  try {
    const res = await getAcceptanceApi(row.id);
    const acc = res.data || {};
    resetDetail();
    acceptanceId.value = acc.id;
    requestId.value = acc.requestId;
    requestTitle.value = acc.requestTitle || '';
    projectId.value = acc.projectId;
    projectName.value = acc.projectName || '';

    // 加载图片 URL（ossId -> url）
    const ossIds: string[] = [];
    (acc.items || []).forEach((it: any) => {
      if (it.photoUrl) ossIds.push(it.photoUrl);
      if (it.invoiceUrl) ossIds.push(it.invoiceUrl);
    });
    const urlMap: Record<string, string> = {};
    if (ossIds.length > 0) {
      try {
        const ossRes = await ossListByIdsApi(ossIds.join(','));
        (ossRes.data || []).forEach((oss: any) => {
          urlMap[oss.ossId] = oss.url;
        });
      } catch (e) {
        console.warn('加载 OSS 图片失败', e);
      }
    }

    items.value = (acc.items || []).map((it: any) => ({
      id: it.id,
      requestItemId: it.requestItemId,
      itemName: it.itemName,
      spec: it.spec,
      applyPrice: Number(it.applyPrice) || 0,
      invoicePrice: it.invoicePrice !== undefined && it.invoicePrice !== null ? String(it.invoicePrice) : '',
      photoUrl: it.photoUrl || '',
      invoiceUrl: it.invoiceUrl || '',
      photoFileList: it.photoUrl ? [{ url: urlMap[it.photoUrl] || '', ossId: it.photoUrl }] : [],
      invoiceFileList: it.invoiceUrl ? [{ url: urlMap[it.invoiceUrl] || '', ossId: it.invoiceUrl }] : [],
      remark: it.remark || ''
    }));
    view.value = 'detail';
  } catch (e: any) {
    showFailToast(e?.response?.data?.msg || '加载验收单失败');
  } finally {
    closeToast();
  }
};

const resetDetail = () => {
  acceptanceId.value = undefined;
  requestId.value = undefined;
  requestTitle.value = '';
  projectId.value = undefined;
  projectName.value = '';
  items.value = [];
};

const afterRead = async (file: any, row: any, type: 'photo' | 'invoice') => {
  const f = file.file;
  if (!f) {
    showFailToast('未获取到照片，请重试');
    return;
  }
  file.status = 'uploading';
  file.message = '上传中';
  try {
    const res = await uploadApi(f);
    const { ossId, url } = res.data || {};
    if (type === 'photo') {
      row.photoUrl = ossId;
    } else {
      row.invoiceUrl = ossId;
    }
    // 让 uploader 能预览
    file.url = url;
    file.ossId = ossId;
    file.status = 'done';
    file.message = '';
    showSuccessToast('上传成功');
  } catch (e) {
    // 保留失败文件供点击重试（上传失败常见于首次触发相机权限被挂起）
    file.status = 'failed';
    file.message = '上传失败，点击重试';
    showFailToast('上传失败，点击图片重试');
  }
};

/** 点击失败状态的文件重试上传 */
const onFileClick = (file: any, row: any, type: 'photo' | 'invoice') => {
  if (file?.status === 'failed') {
    afterRead(file, row, type);
  }
};

const onDelete = (file: any, row: any, type: 'photo' | 'invoice') => {
  if (type === 'photo') {
    row.photoUrl = '';
  } else {
    row.invoiceUrl = '';
  }
};

const buildAcceptanceData = () => {
  return {
    id: acceptanceId.value,
    requestId: requestId.value,
    projectId: projectId.value,
    acceptanceDate: new Date().toISOString().split('T')[0],
    remark: '',
    items: items.value.map(row => ({
      id: row.id,
      requestItemId: row.requestItemId,
      itemName: row.itemName,
      spec: row.spec,
      applyPrice: row.applyPrice,
      invoicePrice: row.invoicePrice,
      photoUrl: row.photoUrl,
      invoiceUrl: row.invoiceUrl || undefined,
      priceCheck: Number(row.invoicePrice) > Number(row.applyPrice) ? 'over' : 'pass',
      remark: row.remark
    }))
  };
};

const saveDraft = async () => {
  if (!requestId.value) {
    showFailToast('缺少关联采购申请');
    return;
  }
  savingDraft.value = true;
  showLoadingToast({ message: '保存中...', forbidClick: true, duration: 0 });
  try {
    const data = buildAcceptanceData();
    if (acceptanceId.value) {
      await updateAcceptanceApi(data);
    } else {
      await addAcceptanceApi(data);
    }
    showSuccessToast('草稿保存成功');
    resetDetail();
    view.value = 'list';
    onRefresh();
  } catch (e: any) {
    showFailToast(e?.response?.data?.msg || '保存失败');
  } finally {
    savingDraft.value = false;
    closeToast();
  }
};

const submitAcceptance = async () => {
  if (!requestId.value) {
    showFailToast('缺少关联采购申请');
    return;
  }
  // 校验
  for (const row of items.value) {
    if (!row.photoUrl) {
      showFailToast(`【${row.itemName}】请拍摄实物照片`);
      return;
    }
    if (row.invoicePrice === '' || row.invoicePrice === null || row.invoicePrice === undefined) {
      showFailToast(`【${row.itemName}】请填写发票金额`);
      return;
    }
    const invoicePrice = Number(row.invoicePrice);
    const applyPrice = Number(row.applyPrice);
    if (invoicePrice > applyPrice) {
      showConfirmDialog({
        title: '金额冲红',
        message: `【${row.itemName}】发票金额大于申请单价，提交后需要重新开发票或重新采购。是否继续？`
      }).then(() => doSubmit()).catch(() => {});
      return;
    }
  }
  doSubmit();
};

const doSubmit = async () => {
  submitting.value = true;
  showLoadingToast({ message: '提交中...', forbidClick: true, duration: 0 });
  try {
    await submitAcceptanceApi(buildAcceptanceData());
    showSuccessToast('验收提交成功，已进入审批流程');
    resetDetail();
    view.value = 'list';
    onRefresh();
  } catch (e: any) {
    showFailToast(e?.response?.data?.msg || '提交失败');
  } finally {
    submitting.value = false;
    closeToast();
  }
};

// 初始加载
loadList();
</script>

<style scoped lang="scss">
.mobile-acceptance-page {
  min-height: 100vh;
  background: #f7f8fa;
}
.list-container {
  padding: 12px 0 24px;
}
.acceptance-card {
  margin-bottom: 12px;
}
.info-card {
  margin: 12px 0;
}
.items-title {
  padding: 12px 16px;
  font-size: 14px;
  color: #969799;
}
.item-card {
  margin-bottom: 12px;
}
.uploader-row {
  padding: 10px 16px;
  background: #fff;
}
.uploader-label {
  margin-bottom: 8px;
  font-size: 14px;
  color: #323233;
}
.required {
  color: #ee0a24;
  margin-right: 2px;
}
.submit-area {
  padding: 16px;
  margin-bottom: 24px;
}
</style>
