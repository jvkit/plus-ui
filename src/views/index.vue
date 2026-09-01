<template>
  <div class="home">
    <section class="hero-panel">
      <div class="hero-copy">
        <h1>OA 协同办公系统</h1>
        <p>
          面向科研与办公场景的数字化协同平台。深度集成采购全生命周期管理（PMS）：多级项目树、自动编码、
          科研/非科研分类树形选择、申请标题自动拼接、Excel 按标题导出；采购申请、验收、入库、领用全流程走 Warm-Flow 审批；
          发票 AI 识别自动匹配订单商品；PRIME AI 提供智能对话与文档处理能力。让采购、仓库与办公真正高效协同。
        </p>
        <div class="hero-actions">
          <el-button type="primary" @click="go('/procurement/request')">进入采购申请</el-button>
          <el-button plain @click="goPrimeAi">打开 PRIME AI</el-button>
        </div>
      </div>
    </section>

    <div class="content-grid">
      <section class="section-card">
        <div class="section-head">
          <div>
            <h2>核心功能</h2>
          </div>
        </div>
        <div class="product-list">
          <article v-for="product in products" :key="product.name" class="product-card">
            <div class="product-top">
              <div>
                <h3>{{ product.name }}</h3>
                <p>{{ product.summary }}</p>
              </div>
              <span class="product-version">{{ product.badge }}</span>
            </div>
            <div class="product-tags">
              <el-tag v-for="tag in product.tags" :key="tag" effect="plain">{{ tag }}</el-tag>
            </div>
            <div class="product-actions">
              <el-button type="primary" plain @click="handleProductClick(product.route)">
                {{ product.actionLabel }}
              </el-button>
            </div>
          </article>
        </div>
      </section>

      <section class="section-card capability-card">
        <div class="section-head">
          <div>
            <h2>能力亮点</h2>
          </div>
        </div>
        <div class="capability-groups">
          <article v-for="group in capabilityGroups" :key="group.title" class="capability-group">
            <h3>{{ group.title }}</h3>
            <ul>
              <li v-for="item in group.items" :key="item">{{ item }}</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup name="Index" lang="ts">
import { useRouter } from 'vue-router';
import { usePermissionStore } from '@/store/modules/permission';
import type { RouteRecordRaw } from 'vue-router';

const router = useRouter();
const permissionStore = usePermissionStore();

// 动态查找 PRIME AI 外链路由（避免硬编码 IP/端口）
// PRIME AI 是顶层外链菜单，父路由 path 为 '/'，真正的 iframe 子路由 path 为 '172/16/16/110/3305'
const findPrimeAiPath = (routes: RouteRecordRaw[], parentPath = ''): string | undefined => {
  for (const r of routes) {
    const path = r.path ?? '';
    const fullPath = path.startsWith('/') ? path : `${parentPath}/${path}`.replace(/\/+/g, '/');
    if ((r.meta?.title === 'PRIME AI' || r.meta?.link?.includes('3305')) && r.meta?.link) {
      return fullPath;
    }
    if (r.children) {
      const found = findPrimeAiPath(r.children, fullPath);
      if (found) return found;
    }
  }
  return undefined;
};

const goPrimeAi = () => {
  const path = findPrimeAiPath(permissionStore.sidebarRouters);
  if (path) {
    router.push(path);
  } else {
    router.push('/aichat');
  }
};

const products = [
  {
    name: '采购管理',
    badge: 'PMS',
    summary: '采购项目、供应商、BOM、采购申请与订单的全流程闭环管理。',
    tags: ['多级项目树', '自动编码', '分类树形选择', 'Excel 导出'],
    actionLabel: '进入采购',
    route: '/procurement/request'
  },
  {
    name: 'PRIME AI',
    badge: 'AI',
    summary: '一站式 AI 能力入口，集成智能对话、发票识别、文档处理与办公辅助。',
    tags: ['智能对话', '发票识别', 'AI 辅助'],
    actionLabel: '打开 PRIME AI',
    route: '__prime_ai__'
  },
  {
    name: '工作流审批',
    badge: 'Flow',
    summary: '基于 Warm-Flow 的流程定义、实例与审批流转管理。',
    tags: ['流程定义', '审批流转', '流程监控'],
    actionLabel: '流程管理',
    route: '/workflow/processDefinition'
  },
  {
    name: '系统管理',
    badge: 'Admin',
    summary: '用户、角色、权限、菜单与字典的统一管理。',
    tags: ['多租户', 'Sa-Token', '数据权限'],
    actionLabel: '用户管理',
    route: '/system/user'
  }
];

const capabilityGroups = [
  {
    title: '采购能力',
    items: [
      '项目与申请编码自动生成',
      '多级项目树形结构',
      '科研/非科研分类树形选择',
      '申请标题自动拼接、Excel 按标题命名',
      '采购申请→审批→验收→入库→领用全流程闭环'
    ]
  },
  {
    title: 'AI 能力',
    items: [
      'PRIME AI 智能对话入口',
      '发票 PDF AI 识别与订单商品自动匹配',
      '冲红发票字段识别与提示',
      '多页发票处理与校验'
    ]
  },
  {
    title: '平台能力',
    items: [
      '基于 Warm-Flow 的可视化审批流',
      '动态菜单与按钮级权限控制',
      '手机端专属验收页面',
      '代码生成器、日志与在线监控'
    ]
  }
];

const go = (route: string) => {
  router.push(route);
};

const handleProductClick = (route: string) => {
  if (route === '__prime_ai__') {
    goPrimeAi();
  } else {
    go(route);
  }
};
</script>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-panel,
.section-card {
  border-radius: 28px;
  border: 1px solid var(--app-surface-border);
  background: var(--app-surface-bg);
  box-shadow: var(--app-shadow-sm);
  backdrop-filter: blur(18px);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 18px;
  padding: 30px;
  background: radial-gradient(circle at top left, rgba(53, 109, 255, 0.16), transparent 30%), var(--app-surface-bg);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 14px;

  h1 {
    margin: 0;
    font-size: clamp(30px, 4vw, 46px);
    line-height: 1.06;
    letter-spacing: -0.04em;
    color: var(--app-text-title);
  }

  p {
    margin: 0;
    max-width: 760px;
    color: var(--app-text-muted);
    font-size: 15px;
    line-height: 1.8;
  }
}

.hero-badge {
  display: inline-flex;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(53, 109, 255, 0.12);
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.hero-stats {
  display: grid;
  gap: 12px;
}

.stat-card {
  padding: 18px 20px;
  border-radius: 22px;
  background: var(--app-elevated-soft-bg);
  border: 1px solid var(--app-surface-border);
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    color: var(--app-text-title);
    font-size: 24px;
    letter-spacing: -0.03em;
  }

  span {
    color: var(--app-text-muted);
    font-size: 13px;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
  gap: 20px;
}

.section-card {
  padding: 24px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;

  h2 {
    margin: 6px 0 0;
    color: var(--app-text-title);
    font-size: 26px;
    letter-spacing: -0.03em;
  }
}

.section-kicker {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.product-list,
.capability-groups {
  display: grid;
  gap: 16px;
}

.product-card {
  padding: 22px;
  border-radius: 24px;
  background: var(--app-elevated-soft-bg);
  border: 1px solid var(--app-surface-border);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--app-shadow-sm);
    border-color: rgba(53, 109, 255, 0.2);
  }
}

.product-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h3 {
    margin: 0 0 8px;
    color: var(--app-text-title);
    font-size: 22px;
    letter-spacing: -0.03em;
  }

  p {
    margin: 0;
    color: var(--app-text-muted);
    line-height: 1.8;
  }
}

.product-version {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(53, 109, 255, 0.12);
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
}

.product-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.product-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.capability-card {
  background: radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 28%), var(--app-surface-bg);
}

.capability-group {
  padding: 18px 18px 18px 20px;
  border-radius: 22px;
  background: var(--app-elevated-soft-bg);
  border: 1px solid var(--app-surface-border);

  h3 {
    margin: 0 0 12px;
    color: var(--app-text-title);
    font-size: 18px;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 10px;
  }

  li {
    position: relative;
    padding-left: 16px;
    color: var(--app-text-muted);
    line-height: 1.7;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--app-accent-strong);
      box-shadow: 0 0 0 5px rgba(53, 109, 255, 0.12);
    }
  }
}

@media (max-width: 960px) {
  .hero-panel,
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-panel,
  .section-card {
    padding: 20px;
    border-radius: 22px;
  }

  .product-top {
    flex-direction: column;
  }
}

html.dark {
  .hero-panel {
    background: radial-gradient(circle at top left, rgba(53, 109, 255, 0.18), transparent 30%), var(--app-surface-bg);
  }
}
</style>
