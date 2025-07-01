import { ref, onUnmounted } from 'vue';
import { Graph } from '@antv/g6';

/**
 * 这是一个封装了所有 G6 相关逻辑的 Vue 组合式函数
 * @param {import('vue').Ref<HTMLElement | null>} containerRef - G6 画布的 DOM 容器的引用
 */
export function useG6(containerRef) {
  // --- 内部状态 ---
  const isAddingEdge = ref(false);
  let graph = null;
  let tempEdge = null;

  // --- 核心方法 ---

  // 初始化图表
  const init = () => {
    if (!containerRef.value) return;

    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight || 600;

    graph = new Graph({
      container: containerRef.value,
      width,
      height,
      layout: { type: 'fruchterman', gravity: 10, speed: 5 },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-node'],
      node: {
        style: {
          size: 45,
          fill: '#5B8FF9',
          stroke: '#C2D8FF',
          lineWidth: 2,
          cursor: 'pointer',
        },
        label: { style: { fill: '#fff', fontSize: 12, fontWeight: 'bold' } },
      },
      edge: { style: { stroke: '#aaa', lineWidth: 2, endArrow: true } },
    });

    graph.setData({ nodes: [], edges: [] });
    bindEventListeners();
    window.addEventListener('resize', handleResize);
  };

  // 绑定事件监听
  const bindEventListeners = () => {
    // [DEBUG] 添加日志，追踪事件是否触发
    console.log('Binding G6 event listeners...');

    // 双击节点：编辑文本
    graph.on('node:dblclick', (evt) => {
      // [DEBUG]
      console.log('Event fired: node:dblclick', evt);
      const { item } = evt;
      const model = item.getModel();
      const labelText = model.style?.labelText || '';
      const newLabel = prompt('请输入新的节点名称：', labelText);
      if (newLabel !== null && newLabel.trim() !== '') {
        graph.updateItem(item, { style: { labelText: newLabel } });
      }
    });

    // 右键节点：删除节点
    graph.on('node:contextmenu', (evt) => {
      // [DEBUG]
      console.log('Event fired: node:contextmenu', evt);
      evt.preventDefault();
      const { item } = evt;
      if (confirm(`确定要删除节点 "${item.getModel().style.labelText}" 吗？`)) {
        graph.removeItem(item);
      }
    });
    
    // 使用 G6 的事件系统来处理画布右键菜单
    graph.on('canvas:contextmenu', (evt) => {
      // [DEBUG]
      console.log('Event fired: canvas:contextmenu', evt);
      evt.preventDefault(); // 阻止浏览器默认右键菜单
      // G6 事件对象中的 evt.x 和 evt.y 就是我们需要的画布坐标
      const canvasPoint = { x: evt.x, y: evt.y };
      const element = graph.getElementByPoint(canvasPoint);

      // 如果鼠标下没有图形项 (即点击在画布空白处)，则执行添加节点逻辑
      if (!element) {
        if (confirm('是否在此处添加一个新节点？')) {
          graph.addNode({
            id: `node-${Date.now()}`,
            data: {
              x: canvasPoint.x,
              y: canvasPoint.y,
            },
            style: { labelText: '新节点' },
          });
        }
      }
    });

    // “添加连线”模式下的点击事件
    graph.on('node:click', (evt) => {
      // [DEBUG]
      console.log('Event fired: node:click', evt);
      if (!isAddingEdge.value) return;
      const { item } = evt;
      const nodeId = item.getID();

      if (!tempEdge) {
        tempEdge = graph.addEdge({
          id: 'temp-edge',
          source: nodeId,
          target: nodeId,
          style: { stroke: '#F6BD16', lineDash: [5, 5] },
        });
      } else {
        if (tempEdge.getSource().getID() === nodeId) {
          graph.removeItem(tempEdge);
          tempEdge = null;
          return;
        }
        graph.updateItem(tempEdge, {
          target: nodeId,
          id: `edge-${Date.now()}`,
          style: { stroke: '#aaa', lineDash: [] },
        });
        tempEdge = null;
        toggleEdgeMode();
      }
    });

    // “添加连线”模式下，鼠标移动更新临时边的位置
    graph.on('mousemove', (evt) => {
      // 为了避免日志刷屏，mousemove 事件暂时不添加日志
      if (isAddingEdge.value && tempEdge) {
        // 直接使用 G6 事件对象提供的画布坐标
        const canvasPoint = { x: evt.x, y: evt.y };
        graph.updateItem(tempEdge, { target: canvasPoint });
      }
    });
  };

  // 切换“添加连线”模式
  const toggleEdgeMode = () => {
    isAddingEdge.value = !isAddingEdge.value;
    if (!isAddingEdge.value && tempEdge) {
      graph.removeItem(tempEdge);
      tempEdge = null;
    }
  };

  // 窗口大小调整
  const handleResize = () => {
    if (graph && containerRef.value) {
      const width = containerRef.value.clientWidth;
      const height = containerRef.value.clientHeight;
      graph.setSize([width, height]);
    }
  };
  
  // 组件卸载时销毁图表
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    if (graph) {
      graph.destroy();
    }
  });

  // 返回需要暴露给组件的状态和方法
  return {
    isAddingEdge,
    init,
    toggleEdgeMode,
  };
}