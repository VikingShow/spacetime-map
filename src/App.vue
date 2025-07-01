<template>
  <div id="app-container">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <h1 class="title">时空导图</h1>
      <p class="subtitle">Spacetime Map</p>
      
      <!-- 操作按钮 -->
      <div class="actions">
        <!-- [REFACTORED] 直接绑定从 useG6 中获取的状态和方法 -->
        <button @click="toggleEdgeMode" :class="{ active: isAddingEdge }">
          {{ isAddingEdge ? '取消连线' : '创建连线' }}
        </button>
        <p class="actions-tip">
          提示: 双击节点可编辑文本，右键可操作节点或画布。
        </p>
      </div>

      <div class="timeline-placeholder">
        <p>时间轴区域</p>
        <p class="tip">(步骤 3 中实现)</p>
      </div>
       <footer class="footer">
        <p>V 0.2.1</p>
        <a href="https://github.com/VikingShow/spacetime-map" target="_blank">GitHub Repo</a>
      </footer>
    </aside>

    <!-- 右侧 G6 画布区域 -->
    <main class="main-content">
      <!-- [REFACTORED] g6Container 这个 ref 会被传递给 useG6 -->
      <div id="g6-container" ref="g6Container"></div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
// [REFACTORED] 导入我们新建的组合式函数
import { useG6 } from './composables/useG6.js';

// G6 画布的 DOM 容器
const g6Container = ref(null);

// [REFACTORED] 调用组合式函数，解构出需要用的状态和方法
const { isAddingEdge, init, toggleEdgeMode } = useG6(g6Container);

// onMounted 生命周期钩子现在非常干净
onMounted(async () => {
  // 等待 DOM 渲染完成
  await nextTick();
  // 初始化 G6
  init();
});
</script>

<style>
/* 样式保持不变 */
#app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f7f8fa;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  background-color: #ffffff;
  border-right: 1px solid #e8e8e8;
  padding: 24px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.subtitle {
  font-size: 14px;
  color: #888;
  margin: 4px 0 32px;
}

.actions {
  margin-bottom: 24px;
}

.actions button {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.actions button:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.actions button.active {
  background-color: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.actions-tip {
  font-size: 12px;
  color: #aaa;
  margin-top: 12px;
  line-height: 1.5;
}

.timeline-placeholder {
  flex-grow: 1;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 16px;
}

.tip {
  font-size: 12px;
  color: #ccc;
  margin-top: 8px;
}

.footer {
  margin-top: 24px;
  text-align: center;
  font-size: 12px;
  color: #aaa;
}
.footer a {
  color: #888;
  text-decoration: none;
}
.footer a:hover {
  text-decoration: underline;
}

.main-content {
  flex-grow: 1;
  display: flex;
  position: relative;
}

#g6-container {
  width: 100%;
  height: 100%;
}
</style>
