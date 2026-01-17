const { build } = require('vite');
const { resolve } = require('path');

async function runBuild() {
  try {
    console.log('开始构建...');
    await build({
      configFile: resolve(__dirname, 'vite.config.ts'),
      mode: 'production'
    });
    console.log('✅ 构建成功！');
  } catch (error) {
    console.error('❌ 构建失败：', error);
    process.exit(1);
  }
}

runBuild();
