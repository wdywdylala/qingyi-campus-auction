<template>
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  background: #f5f5f5;
  line-height: 1.6;
  color: #333;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
}

/* 移动端触摸优化 */
@media (max-width: 768px) {
  html {
    font-size: 14px;
  }

  * {
    -webkit-tap-highlight-color: transparent;
  }

  body {
    overflow-x: hidden;
  }
}

/* 防止图片溢出 */
img {
  max-width: 100%;
  height: auto;
}

/* TDesign 组件覆盖 */
.t-button {
  border-radius: 4px;
}

.t-input,
.t-select {
  border-radius: 4px;
}
</style>
