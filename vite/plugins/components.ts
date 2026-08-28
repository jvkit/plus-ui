import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver, VantResolver } from 'unplugin-vue-components/resolvers';
import { resolve } from 'path';

export default () => {
  return Components({
    resolvers: [
      // 自动导入 Element Plus 组件
      ElementPlusResolver({
        importStyle: false
      }),
      // 按需自动导入 Vant 组件与样式
      VantResolver()
    ],
    dts: resolve(import.meta.dirname, '../../src/types/components.d.ts')
  });
};
