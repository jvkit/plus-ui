import type { App } from 'vue';
import auth from './auth';
import cache from './cache';
import download from './download';
import modal from './modal';
import tab from './tab';
import animate from '@/animate';
import {
  addDateRange,
  handleTree,
  parseTime,
  selectDictLabel,
  selectDictLabels
} from '@/utils/ruoyi';
import { useDict } from '@/utils/dict';
import { getConfigKey, updateConfigByKey } from '@/api/system/config';
import { download as dl } from '@/utils/request';

/**
 * 仅挂载无法在组合式中通过 import 替代的实例级能力（与业务模块解耦的壳层 API）。
 * 字典、时间、树、请求下载等请在 setup 中从 @/utils、@/api 显式导入。
 */
export default function installPlugin(app: App) {
  app.config.globalProperties.$tab = tab;
  app.config.globalProperties.$modal = modal;
  app.config.globalProperties.$cache = cache;
  app.config.globalProperties.$download = download;
  app.config.globalProperties.$auth = auth;
  // 预设动画（procurement 等页面通过 proxy.animate.searchAnimate 使用）
  app.config.globalProperties.animate = animate;
  // 兼容从 5.6.2 迁移的旧版页面（procurement 等模板中使用 proxy.parseTime 等）
  app.config.globalProperties.parseTime = parseTime;
  app.config.globalProperties.addDateRange = addDateRange;
  app.config.globalProperties.handleTree = handleTree;
  app.config.globalProperties.selectDictLabel = selectDictLabel;
  app.config.globalProperties.selectDictLabels = selectDictLabels;
  app.config.globalProperties.useDict = useDict;
  app.config.globalProperties.getConfigKey = getConfigKey;
  app.config.globalProperties.updateConfigByKey = updateConfigByKey;
  // 旧版下载方法 proxy.download(url, params, fileName)（procurement 等页面 handleExport 使用）
  app.config.globalProperties.download = dl;
}
