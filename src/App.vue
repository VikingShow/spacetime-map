<template>
  <div id="app-container">
    <!-- 左侧时间轴区域 -->
    <aside class="sidebar">
      <h1 class="title">时空导图</h1>
      <p class="subtitle">Spacetime Map</p>
      <div class="timeline-placeholder">
        <p>时间轴区域</p>
        <p class="tip">(步骤 3 中实现)</p>
      </div>
       <footer class="footer">
        <p>V 0.1.0</p>
        <a href="https://github.com/VikingShow/spacetime-map" target="_blank">GitHub Repo</a>
      </footer>
    </aside>

    <!-- 右侧 G6 画布区域 -->
    <main class="main-content">
      <div id="g6-container" ref="g6Container"></div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, nextTick } from 'vue';
// 导入 G6 v5 的核心 Graph 类
import { Graph } from '@antv/g6';

// G6 画布的 DOM 容器
const g6Container = ref(null);
// G6 Graph 实例
let graph = null;

// 初始示例数据 (G6 v5 格式)
const mockData = {
  nodes: [
    { id: 'node1', style: { labelText: '时空导图' } },
    { id: 'node2', style: { labelText: '核心概念' } },
    { id: 'node3', style: { labelText: '技术选型' } },
    { id: 'node4', style: { labelText: '前端' } },
    { id: 'node5', style: { labelText: '后端' } },
    { id: 'node6', style: { labelText: 'Vue.js' } },
    { id: 'node7', style: { labelText: 'AntV G6' } },
    { id: 'node8', style: { labelText: 'Node.js' } },
  ],
  edges: [
    { source: 'node1', target: 'node2' },
    { source: 'node1', target: 'node3' },
    { source: 'node3', target: 'node4' },
    { source: 'node3', target: 'node5' },
    { source: 'node4', target: 'node6' },
    { source: 'node4', target: 'node7' },
    { source: 'node5', target: 'node8' },
  ],
};

// 初始化 G6 图
const initGraph = () => {
  if (!g6Container.value) return;

  const width = g6Container.value.clientWidth;
  const height = g6Container.value.clientHeight || 600;

  graph = new Graph({
    container: g6Container.value,
    width,
    height,
    // v5 布局和节点配置语法
    layout: {
      type: 'fruchterman',
      gravity: 5,
      speed: 5,
      clustering: true,
      clusterGravity: 30,
    },
    modes: {
      default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
    },
    node: {
      style: {
        size: 40,
        fill: '#5B8FF9',
        stroke: '#C2D8FF',
        lineWidth: 2,
      },
      label: {
        style: {
          fill: '#333',
          fontSize: 12,
        },
      },
    },
    edge: {
      style: {
        stroke: '#e2e2e2',
        lineWidth: 1.5,
      },
    },
  });

  // [FIX] 监听 'afterlayout' 事件，在布局完成后再适应视图
  graph.on('afterlayout', () => {
    graph.fitView(20);
    // 这是一个一次性事件，用完后最好关闭，防止后续重排布局时再次触发
    graph.off('afterlayout');
  });

  // 使用 G6 v5 稳定版 API `setData` 来加载数据
  // 这会触发布局计算，并随后触发 'afterlayout' 事件
  graph.setData(mockData);
};

// 监听窗口大小变化，自适应调整画布大小
const handleResize = () => {
  if (graph && g6Container.value) {
    const width = g6Container.value.clientWidth;
    const height = g6Container.value.clientHeight;
    // 使用 v5 的 setSize API
    graph.setSize([width, height]);
    graph.fitView(20);
  }
};

// onMounted 生命周期钩子
onMounted(async () => {
  // 等待 DOM 更新确保容器有尺寸
  await nextTick();
  initGraph();
  window.addEventListener('resize', handleResize);
});

// onUnmounted 生命周期钩子
onUnmounted(() => {
  if (graph) {
    graph.destroy();
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style>
#app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f7f8fa;
}

/* 左侧边栏 */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background-color: #ffffff;
  border-right: 1px solid #e8e8e8;
  padding: 24px;
  display: flex;
  flex-direction: column;
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


/* 右侧主内容区 */
.main-content {
  flex-grow: 1;
  display: flex;
  position: relative; /* 为 G6 画布提供定位上下文 */
}

#g6-container {
  width: 100%;
  height: 100%;
}
</style>
