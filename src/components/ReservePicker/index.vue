<template>
  <div v-loading="loading" class="reserve-picker">
    <!-- 平铺卡片网格：点击选人，选中顺序即扣款顺序 -->
    <div class="rp-grid">
      <div
        v-for="account in accounts"
        :key="String(account.personId)"
        class="rp-card"
        :class="{ 'is-selected': orderOf(account) > 0, 'is-disabled': isCardDisabled(account) }"
        @click="toggle(account)"
      >
        <!-- 右上角顺序序号：1、2、3… -->
        <div v-if="orderOf(account) > 0" class="rp-order">{{ orderOf(account) }}</div>
        <div class="rp-name">{{ account.personName }}</div>
        <div class="rp-row">
          <span class="rp-label">额度</span>
          <span class="rp-value">¥ {{ formatMoney(account.quota) }}</span>
        </div>
        <div class="rp-row">
          <span class="rp-label">已用</span>
          <span class="rp-value" style="color: var(--el-color-danger)">¥ {{ formatMoney(account.occupied) }}</span>
        </div>
        <div class="rp-row">
          <span class="rp-label">可用</span>
          <span class="rp-value" :style="{ color: Number(account.available) <= 0 ? 'var(--el-color-danger)' : 'var(--el-color-success)' }">
            ¥ {{ formatMoney(account.available) }}
          </span>
        </div>
      </div>
    </div>
    <el-empty v-if="!loading && accounts.length === 0" description="暂无备用金账户，请联系资金管理员配置" :image-size="60" />

    <!-- 底部动态提示：一人够用锁定 / 多人按序号扣款 -->
    <div class="rp-tip" :class="{ 'rp-tip-locked': firstEnough }">{{ tipText }}</div>
  </div>
</template>

<script setup name="ReservePicker" lang="ts">
import { ref, computed, onMounted } from 'vue';
import { reserveOptions } from '@/api/procurement/reserve';
import { ReserveOptionVO, ReservePerson } from '@/api/procurement/reserve/types';

const props = withDefaults(
  defineProps<{
    /** 选中的人（有序数组，顺序=扣款顺序）：[{ personId, personName }, ...] */
    modelValue?: ReservePerson[];
    /** 订单金额：用于"1 号是否够用"的锁定判定，0/undefined 时不锁定 */
    amount?: number;
    /** 整体禁用（详情查看态） */
    disabled?: boolean;
  }>(),
  {
    modelValue: () => [],
    amount: 0,
    disabled: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: ReservePerson[]): void;
}>();

/** 备用金账户（额度/已用/可用，来自 /procurement/reserve/options，登录即可、普通用户可用） */
const accounts = ref<ReserveOptionVO[]>([]);
const loading = ref(false);

/** 组件自包含数据加载 */
const loadAccounts = async () => {
  loading.value = true;
  try {
    const res = await reserveOptions();
    accounts.value = res.data || [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadAccounts();
});

/** personId 统一按字符串比较（后端 Long 经 JSON 可能变 number） */
const samePerson = (a: number | string | undefined, b: number | string | undefined) => String(a) === String(b);

/** 卡片选中序号（1 起，0=未选） */
const orderOf = (account: ReserveOptionVO) => {
  const idx = props.modelValue.findIndex((p) => samePerson(p.personId, account.personId));
  return idx >= 0 ? idx + 1 : 0;
};

/** 选中第 1 人的可用额度 */
const firstAvailable = computed(() => {
  const first = props.modelValue[0];
  if (!first) return 0;
  const account = accounts.value.find((a) => samePerson(a.personId, first.personId));
  return Number(account?.available) || 0;
});

/** 1 号是否够用：已选 1 人及以上且第 1 人可用 >= 金额 */
const firstEnough = computed(() => props.modelValue.length === 1 && Number(props.amount) > 0 && firstAvailable.value >= Number(props.amount));

/** 已选人员的可用额度合计 */
const selectedAvailable = computed(() => {
  let total = 0;
  for (const p of props.modelValue) {
    const account = accounts.value.find((a) => samePerson(a.personId, p.personId));
    total += Number(account?.available) || 0;
  }
  return total;
});

/** 已选合计是否已满足订单金额 */
const enoughSelected = computed(() => props.modelValue.length > 0 && Number(props.amount) > 0 && selectedAvailable.value >= Number(props.amount));

/** 卡片置灰：整体禁用 / 未选且可用为 0 / 1 号够用时其余未选全部锁定 */
const isCardDisabled = (account: ReserveOptionVO) => {
  if (props.disabled) return true;
  if (orderOf(account) > 0) return false; // 已选卡片保持可点，便于取消
  if (Number(account.available) <= 0) return true;
  if (enoughSelected.value) return true;
  return false;
};

/** 点击卡片：未选追加到末尾，已选取消选中（后续序号自动重排） */
const toggle = (account: ReserveOptionVO) => {
  if (isCardDisabled(account)) return;
  if (orderOf(account) > 0) {
    emit(
      'update:modelValue',
      props.modelValue.filter((p) => !samePerson(p.personId, account.personId))
    );
  } else {
    emit('update:modelValue', [...props.modelValue, { personId: account.personId, personName: account.personName }]);
  }
};

/** 底部提示文字 */
const tipText = computed(() => {
  if (props.disabled) return '查看态：备用金人按序号顺序扣款';
  if (accounts.value.length === 0) return '暂无备用金账户';
  const n = props.modelValue.length;
  if (n === 0) return '点击卡片选择备用金人，点选顺序即扣款顺序';
  const names = props.modelValue.map((p) => p.personName).join(' → ');
  if (firstEnough.value) return `1 号够用，已锁定（仅 ${props.modelValue[0].personName} 扣款）`;
  return `已选 ${n} 人按序号顺序扣款：${names}（合计可用需 ≥ 订单金额）`;
});

/** 金额格式化（两位小数，与资金页一致） */
const formatMoney = (val: number | string | undefined | null) => {
  if (val === null || val === undefined || val === '') return '0.00';
  return Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>

<style scoped>
.reserve-picker {
  width: 100%;
}
/* 平铺卡片网格：固定卡片宽度自动换行 */
.rp-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.rp-card {
  position: relative;
  width: 200px;
  padding: 10px 12px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
}
.rp-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
}
/* 选中态：主题色描边 + 浅底 */
.rp-card.is-selected {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}
/* 置灰态：禁点 */
.rp-card.is-disabled {
  cursor: not-allowed;
  opacity: 0.55;
  background-color: var(--el-fill-color-light);
}
.rp-card.is-disabled:hover {
  border-color: var(--el-border-color-lighter);
  box-shadow: none;
}
/* 右上角顺序序号 */
.rp-order {
  position: absolute;
  top: -1px;
  right: -1px;
  min-width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  padding: 0 5px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background-color: var(--el-color-primary);
  border-radius: 0 4px 0 12px;
}
.rp-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 6px;
}
.rp-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  line-height: 20px;
}
.rp-label {
  color: var(--el-text-color-secondary);
}
.rp-value {
  font-weight: 500;
  color: var(--el-text-color-primary);
}
.rp-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.rp-tip-locked {
  color: var(--el-color-success);
}
</style>
