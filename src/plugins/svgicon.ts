import type { App } from 'vue';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import { addCollection } from '@iconify/vue';
import { icons as epIcons } from '@iconify-json/ep';

// 离线注入 Element Plus 官方图标集合，使 `ep:xxx` 图标（菜单、按钮等）离线可用
addCollection(epIcons);

export default {
  install: (app: App) => {
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
      app.component(key, component);
    }
  }
};
