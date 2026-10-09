<template>
  <div v-loading="state.loading" class="layout-navbars-breadcrumb-user-news">
    <div class="head-box">
      <div class="head-box-title">消息盒子</div>
      <div class="head-box-btn" @click="handleReadAll">全部已读</div>
    </div>
    <el-tabs v-model="activeTab" class="message-tabs" stretch>
      <el-tab-pane name="system">
        <template #label>
          <span>系统 {{ tabCount.system }}</span>
        </template>
      </el-tab-pane>
      <el-tab-pane name="notice">
        <template #label>
          <span>通知 {{ tabCount.notice }}</span>
        </template>
      </el-tab-pane>
      <el-tab-pane name="workflow">
        <template #label>
          <span class="workflow-tab">
            工作 {{ tabCount.workflow }}
            <span v-if="unreadWorkflowCount > 0" class="unread-dot"></span>
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>
    <div v-loading="state.loading" class="content-box">
      <template v-if="currentNewsList.length > 0">
        <div v-for="(v, k) in currentNewsList" :key="k" class="content-box-item" @click="onNewsClick(k)">
          <div class="item-conten">
            <div class="content-box-title">{{ v.title || '消息' }}</div>
            <div>{{ v.message }}</div>
            <div v-if="v.content" class="content-box-msg">{{ v.content }}</div>
            <div class="content-box-time">{{ v.time }}</div>
          </div>
          <!-- 已读/未读 -->
          <span v-if="v.read" class="el-tag el-tag--success el-tag--mini read">已读</span>
          <span v-else class="el-tag el-tag--danger el-tag--mini read">未读</span>
        </div>
      </template>
      <el-empty v-else :description="emptyDescription"></el-empty>
    </div>
  </div>
</template>

<script setup lang="ts" name="layoutBreadcrumbUserNews">
import router from '@/router';
import { ElMessageBox } from 'element-plus';
import { useNoticeStore } from '@/store/modules/notice';
import { useUserStore } from '@/store/modules/user';
import { markMessageRead, markMessageReadBatch } from '@/utils/message-read';
import { NOTICE_GROUP } from '@/utils/push-message';

const noticeStore = useNoticeStore();
const userStore = useUserStore();

// 定义变量内容
const state = reactive({
  loading: false
});
const activeTab = ref<string>(NOTICE_GROUP.WORKFLOW);
const newsList = computed(() => noticeStore.state.notices);

const tabCount = computed(() => ({
  system: newsList.value.filter((item: any) => (item.category || NOTICE_GROUP.SYSTEM) === NOTICE_GROUP.SYSTEM).length,
  notice: newsList.value.filter((item: any) => item.category === NOTICE_GROUP.NOTICE).length,
  workflow: newsList.value.filter((item: any) => item.category === NOTICE_GROUP.WORKFLOW).length
}));

const unreadWorkflowCount = computed(() =>
  newsList.value.filter((item: any) => item.category === NOTICE_GROUP.WORKFLOW && !item.read).length
);

const currentNewsList = computed(() => {
  return newsList.value.filter((item: any) => {
    return (item.category || NOTICE_GROUP.SYSTEM) === activeTab.value;
  });
});

const emptyDescription = computed(() => {
  if (activeTab.value === NOTICE_GROUP.NOTICE) {
    return '暂无通知公告消息';
  }
  if (activeTab.value === NOTICE_GROUP.WORKFLOW) {
    return '暂无工作流消息';
  }
  return '暂无系统消息';
});

//点击消息，写入已读
const onNewsClick = async (item: any) => {
  const current = currentNewsList.value[item];
  if (current?.messageId) {
    markMessageRead(userStore.userId, current.messageId);
    noticeStore.markRead(current.messageId);
  }
  if (current?.path) {
    await router.push(current.path);
  }
};

const readAll = () => {
  const ids = newsList.value
    .map((item: any) => item.messageId)
    .filter((item: string | number | undefined) => item !== undefined && item !== null);
  markMessageReadBatch(userStore.userId, ids);
  noticeStore.markReadBatch(ids);
};

/** 全部已读：加确认，防止误点把工作消息清掉 */
const handleReadAll = async () => {
  const unreadWorkflow = newsList.value.filter((item: any) => item.category === NOTICE_GROUP.WORKFLOW && !item.read);
  const hint = unreadWorkflow.length > 0
    ? `还有 ${unreadWorkflow.length} 条未读工作消息，标记后需逐条找回。确定全部已读？`
    : '确定将所有消息标记为已读？';
  try {
    await ElMessageBox.confirm(hint, '全部已读确认', {
      confirmButtonText: '全部已读',
      cancelButtonText: '取消',
      type: 'warning'
    });
    readAll();
  } catch {
    // 用户取消
  }
};
</script>

<style lang="scss" scoped>
.layout-navbars-breadcrumb-user-news {
  display: flex;
  flex-direction: column;
  min-width: 0;

  .head-box {
    display: flex;
    border-bottom: 1px solid var(--app-surface-border);
    box-sizing: border-box;
    color: var(--app-text-title);
    justify-content: space-between;
    height: 40px;
    align-items: center;
    padding: 0 2px 10px;

    .head-box-title {
      font-size: 14px;
      font-weight: 600;
    }

    .head-box-btn {
      color: var(--app-accent-strong);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      opacity: 0.8;

      &:hover {
        opacity: 1;
      }
    }
  }

  .message-tabs {
    padding-top: 6px;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      background: var(--app-surface-border);
    }

    :deep(.el-tabs__item) {
      font-size: 12px;
      height: 34px;
      color: var(--app-text-muted);
    }

    :deep(.el-tabs__item.is-active) {
      color: var(--app-accent-strong);
      font-weight: 600;
    }
  }

  // 工作 tab 未读红点
  .workflow-tab {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 4px;

    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--el-color-danger);
      display: inline-block;
    }
  }

  .content-box {
    height: 300px;
    overflow: auto;
    font-size: 13px;
    padding: 8px 0 0;

    .content-box-item {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      padding: 12px;
      margin: 4px 0;
      border-radius: 12px;
      cursor: pointer;
      transition:
        background-color 0.2s ease,
        transform 0.2s ease;

      &:hover {
        background: var(--app-accent-soft);
        transform: translateY(-1px);
      }

      .content-box-msg {
        color: var(--el-text-color-secondary);
        margin: 2px 0 0;
        display: -webkit-box;
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .content-box-time {
        color: var(--app-text-muted);
        font-size: 12px;
      }

      .item-conten {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 6px;
        color: var(--app-text-title);
        line-height: 1.6;
      }

      .content-box-title {
        font-size: 12px;
        font-weight: 600;
        color: var(--app-accent-strong);
      }

      .read {
        flex-shrink: 0;
        margin-top: 2px;
      }
    }
  }

  :deep(.el-empty__description p) {
    font-size: 13px;
  }
}
</style>
