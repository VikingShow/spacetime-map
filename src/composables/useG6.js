import { ref, onUnmounted } from 'vue';
import { Graph } from '@antv/g6';

/**
 * 防抖函数：在事件被频繁触发时，只在最后一次触发后的指定延迟时间后执行函数。
 * @param {Function} fn 要执行的函数
 * @param {number} delay 延迟时间（毫秒）
 * @returns {Function} 防抖处理后的函数
 */
function debounce(fn, delay) {
  let timeoutId = null;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}


/**
 * 这是一个封装了所有 G6 相关逻辑的 Vue 组合式函数
 * @param {import('vue').Ref<HTMLElement | null>} containerRef - G6 画布的 DOM 容器的引用
 */
export function useG6(containerRef) {
  // --- 内部状态 ---
  const isAddingEdge = ref(false);
  let graph = null;
  let tempEdge = null; // Now stores the edge model, not the item instance

  // --- 核心方法 ---

  const init = async () => {
    if (!containerRef.value) return;

    const canvasWidth = containerRef.value.clientWidth;
    const canvasHeight = containerRef.value.clientHeight;

    graph = new Graph({
      container: containerRef.value,
      width: canvasWidth,
      height: canvasHeight,
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
      node: {
        style: {
          size: 45,
          fill: '#5B8FF9',
          stroke: '#C2D8FF',
          lineWidth: 2,
          cursor: 'pointer',
          anchorPoints: [ [0.5, 0], [0.5, 1], [0, 0.5], [1, 0.5] ],
        },
        label: { style: { fill: '#fff', fontSize: 12, fontWeight: 'bold' } },
      },
      edge: { style: { stroke: '#aaa', lineWidth: 2, endArrow: true } },
    });

    const initialData = {
      nodes: [
        {
          id: 'root-node-1',
          data: { x: canvasWidth / 2 - 100, y: canvasHeight / 2 },
          style: { labelText: '核心概念', fill: '#f79723', size: 55 },
        },
        {
          id: 'root-node-2',
          data: { x: canvasWidth / 2 + 100, y: canvasHeight / 2 },
          style: { labelText: '技术选型' },
        },
      ],
      edges: [
        { id: 'root-edge', source: 'root-node-1', target: 'root-node-2' }
      ],
    };
    graph.setData(initialData);
    
    await graph.render();
    graph.fitView();
    
    bindEventListeners();
    window.addEventListener('resize', debouncedResize);
  };

  /**
   * 手动运行力导向布局的函数
   */
  const runLayout = () => {
    if (graph) {
      graph.layout({
        type: 'fruchterman',
        gravity: 10,
        speed: 5,
        preventOverlap: true,
        onLayoutEnd: () => {
          graph.fitView();
        }
      });
    }
  };

  // 绑定事件监听
  const bindEventListeners = () => {
    graph.on('node:dblclick', (evt) => {
      const { item } = evt;
      const model = item.getModel();
      const labelText = model.style?.labelText || '';
      const newLabel = prompt('请输入新的节点名称：', labelText);
      if (newLabel !== null && newLabel.trim() !== '') {
        graph.updateItem(item, { style: { labelText: newLabel } });
      }
    });

    graph.on('node:contextmenu', (evt) => {
      evt.preventDefault();
      const { item } = evt;
      if (confirm(`确定要删除节点 "${item.getModel().style.labelText}" 吗？`)) {
        graph.removeItem(item);
      }
    });
    
    graph.on('canvas:contextmenu', (evt) => {
      evt.preventDefault(); 
      if (!evt.item) {
        if (confirm('是否在此处添加一个新节点？')) {
          const newNode = {
            id: `node-${Date.now()}`,
            data: {
              x: evt.canvas.x,
              y: evt.canvas.y,
            },
            style: { labelText: '新节点' },
          };
          
          // [FINAL FIX] 采用更稳健的 setData 模式来更新图表
          const currentData = graph.getData();
          graph.setData({
            nodes: [...currentData.nodes, newNode],
            edges: currentData.edges,
          });
        }
      }
    });

    graph.on('node:click', (evt) => {
      if (!isAddingEdge.value) return;
      const { item } = evt;
      const nodeId = item.getID();

      if (!tempEdge) {
        const edgeModel = {
          id: 'temp-edge',
          source: nodeId,
          target: nodeId,
          style: { stroke: '#F6BD16', lineDash: [5, 5] },
        };
        const currentData = graph.getData();
        graph.setData({
            nodes: currentData.nodes,
            edges: [...currentData.edges, edgeModel],
        });
        tempEdge = edgeModel;
      } else {
        if (tempEdge.source === nodeId) {
          graph.removeData('edge', tempEdge.id); // removeData is still fine for single items
          tempEdge = null;
          return;
        }
        graph.removeData('edge', tempEdge.id);
        const newEdge = {
          id: `edge-${Date.now()}`,
          source: tempEdge.source,
          target: nodeId,
        };
        const currentData = graph.getData();
        graph.setData({
            nodes: currentData.nodes,
            edges: [...currentData.edges, newEdge],
        });
        tempEdge = null;
        toggleEdgeMode();
      }
    });

    graph.on('mousemove', (evt) => {
      if (isAddingEdge.value && tempEdge) {
        const canvasPoint = { x: evt.canvas.x, y: evt.canvas.y };
        graph.updateItem(tempEdge.id, { target: canvasPoint });
      }
    });
  };

  // 切换“添加连线”模式
  const toggleEdgeMode = () => {
    isAddingEdge.value = !isAddingEdge.value;
    if (!isAddingEdge.value && tempEdge) {
      graph.removeData('edge', tempEdge.id);
      tempEdge = null;
    }
  };

  // 这是实际的、被简化的 resize 逻辑
  const resizeGraph = () => {
    if (graph && !graph.destroyed && containerRef.value) {
      const width = containerRef.value.clientWidth;
      const height = containerRef.value.clientHeight;
      graph.setSize([width, height]);
    }
  };

  // 创建一个防抖处理过的 resize 函数
  const debouncedResize = debounce(resizeGraph, 300);
  
  // 组件卸载时销毁图表
  onUnmounted(() => {
    window.removeEventListener('resize', debouncedResize);
    if (graph) {
      graph.destroy();
    }
  });

  // 返回需要暴露给组件的状态和方法
  return {
    isAddingEdge,
    init,
    toggleEdgeMode,
    runLayout,
  };
}
