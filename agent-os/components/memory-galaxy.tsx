'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';

interface MemoryNode {
  id: string;
  title: string;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  category: string;
  confidence: number;
}

interface MemoryGalaxyProps {
  compact?: boolean;
}

export function MemoryGalaxy({ compact = false }: MemoryGalaxyProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(null);

  // 模拟记忆节点数据
  useEffect(() => {
    const mockNodes: MemoryNode[] = [
      { id: 'L1-001', title: '记忆系统初始化', level: 'L1', category: 'system', confidence: 0.95 },
      { id: 'L1-002', title: '多智能体设计讨论', level: 'L1', category: 'design', confidence: 0.88 },
      { id: 'L1-003', title: 'Cursor IDE 推荐', level: 'L1', category: 'tool', confidence: 0.92 },
      { id: 'L1-004', title: 'JSON 偏好', level: 'L1', category: 'communication', confidence: 0.94 },
      { id: 'L2-001', title: '系统化思维', level: 'L2', category: 'thinking', confidence: 0.87 },
      { id: 'L2-002', title: 'AI 新闻消费习惯', level: 'L2', category: 'habit', confidence: 0.91 },
      { id: 'L2-003', title: '文档价值模式', level: 'L2', category: 'work', confidence: 0.88 },
      { id: 'L2-004', title: '自动化寻求模式', level: 'L2', category: 'tool', confidence: 0.90 },
      { id: 'L3-001', title: '资源约束框架', level: 'L3', category: 'context', confidence: 0.90 },
      { id: 'L3-002', title: '清晰结构框架', level: 'L3', category: 'communication', confidence: 0.92 },
      { id: 'L4-001', title: '追求清晰', level: 'L4', category: 'value', confidence: 0.96 },
    ];
    setNodes(mockNodes);
  }, []);

  // D3 可视化
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // 层级颜色
    const levelColors = {
      L1: '#3b82f6',
      L2: '#f59e0b',
      L3: '#8b5cf6',
      L4: '#ef4444'
    };

    // 层级大小
    const levelSizes = {
      L1: 20,
      L2: 25,
      L3: 30,
      L4: 35
    };

    // 初始化位置
    nodes.forEach((node, i) => {
      node.x = width / 2 + (Math.random() - 0.5) * 200;
      node.y = height / 2 + (Math.random() - 0.5) * 200;
    });

    // 力导向图模拟
    const simulation = d3.forceSimulation(nodes as any)
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => levelSizes[d.level] + 10))
      .force('link', d3.forceLink()
        .links(nodes.slice(1).map((n, i) => ({ source: nodes[0], target: n })))
        .distance(100)
      );

    // 绘制连线
    const links = svg.selectAll('.link')
      .data(nodes.slice(1).map((n, i) => ({ source: nodes[0], target: n })))
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.5);

    // 绘制节点
    const nodeGroups = svg.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedNode(d);
      })
      .call(d3.drag()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // 节点圆圈
    nodeGroups.append('circle')
      .attr('r', d => levelSizes[d.level])
      .attr('fill', d => levelColors[d.level])
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

    // 节点标签
    nodeGroups.append('text')
      .text(d => d.level)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold');

    // 标题标签（仅显示前10个字符）
    nodeGroups.append('text')
      .text(d => d.title.length > 8 ? d.title.slice(0, 8) + '...' : d.title)
      .attr('text-anchor', 'middle')
      .attr('dy', d => levelSizes[d.level] + 15)
      .attr('fill', '#374151')
      .attr('font-size', '10px');

    // 更新位置
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroups
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes]);

  return (
    <div className="relative w-full h-full">
      <svg 
        ref={svgRef} 
        className="w-full h-full"
        style={{ minHeight: compact ? '300px' : '500px' }}
      />
      
      {/* 层级图例 */}
      <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 p-3 rounded-lg shadow-sm border text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>L1 情境记忆</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>L2 行为模式</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span>L3 认知框架</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>L4 核心记忆</span>
          </div>
        </div>
      </div>

      {/* 选中节点详情 */}
      {selectedNode && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border max-w-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              selectedNode.level === 'L1' ? 'bg-blue-100 text-blue-700' :
              selectedNode.level === 'L2' ? 'bg-amber-100 text-amber-700' :
              selectedNode.level === 'L3' ? 'bg-purple-100 text-purple-700' :
              'bg-red-100 text-red-700'
            }`}>
              {selectedNode.level}
            </span>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <h4 className="font-semibold text-sm mb-1">{selectedNode.title}</h4>
          <p className="text-xs text-gray-500 capitalize">{selectedNode.category}</p>
          <div className="mt-2 text-xs text-gray-400">
            置信度: {(selectedNode.confidence * 100).toFixed(0)}%
          </div>
        </motion.div>
      )}
    </div>
  );
}
