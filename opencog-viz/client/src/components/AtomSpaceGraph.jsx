import { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

/**
 * AtomSpace Graph — Live force-directed graph rendering Atoms.
 * Node size scales with STI (attention), color encodes TruthValue.
 */
export default function AtomSpaceGraph({ graphData, onNodeSelect, selectedNodeId }) {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Persistent node/link maps that preserve D3 force positions (x, y, vx, vy)
  const nodeMapRef = useRef(new Map());
  const stableDataRef = useRef({ nodes: [], links: [] });

  // Responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Merge incoming graph data into stable refs — preserves D3 simulation coords
  useEffect(() => {
    const nodeMap = nodeMapRef.current;

    // Merge or create nodes, keeping existing x/y/vx/vy
    const incomingIds = new Set();
    for (const incoming of graphData.nodes) {
      incomingIds.add(incoming.id);
      const existing = nodeMap.get(incoming.id);
      if (existing) {
        // Update mutable data only; D3 positions survive
        existing.tv = incoming.tv;
        existing.av = incoming.av;
        existing.label = incoming.label;
        existing.type = incoming.type;
      } else {
        const newNode = { ...incoming };
        nodeMap.set(incoming.id, newNode);
      }
    }

    // Remove stale nodes
    for (const id of nodeMap.keys()) {
      if (!incomingIds.has(id)) nodeMap.delete(id);
    }

    const stableNodes = Array.from(nodeMap.values());
    const stableLinks = graphData.links.map((l) => ({
      ...l,
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
    }));

    stableDataRef.current = { nodes: stableNodes, links: stableLinks };
  }, [graphData]);

  // Derive a render-trigger counter so ForceGraph2D re-paints on each tick
  const [renderTick, setRenderTick] = useState(0);
  useEffect(() => setRenderTick((t) => t + 1), [graphData]);

  /** Map STI to a radius (4–22px) */
  const stiToRadius = (sti) => 4 + Math.min(18, (sti / 500) * 18);

  /** Map TruthValue to a colour gradient:
   *  Low strength → warm red, High strength → cool cyan/green
   *  Confidence modulates saturation */
  const tvToColor = (tv) => {
    const h = tv.strength * 160; // 0=red → 160=cyan-green
    const s = 50 + tv.confidence * 50;
    const l = 40 + tv.confidence * 20;
    return `hsl(${h}, ${s}%, ${l}%)`;
  };

  /** Map STI to glow intensity */
  const stiToGlow = (sti) => Math.min(1, sti / 300);

  /** Custom node renderer */
  const paintNode = useCallback(
    (node, ctx, globalScale) => {
      const r = stiToRadius(node.av?.sti || 0);
      const color = tvToColor(node.tv || { strength: 0.5, confidence: 0.5 });
      const glow = stiToGlow(node.av?.sti || 0);
      const isSelected = node.id === selectedNodeId;

      // Outer glow
      if (glow > 0.1) {
        const gradient = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r * 3);
        gradient.addColorStop(0, `${color.replace(')', `, ${glow * 0.6})`).replace('hsl', 'hsla')}`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 3, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2 / globalScale;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4 / globalScale, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Node circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fill();

      // Inner highlight
      const innerGrad = ctx.createRadialGradient(
        node.x - r * 0.3, node.y - r * 0.3, 0,
        node.x, node.y, r,
      );
      innerGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
      innerGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fill();

      // Label (only when zoomed in enough or node is important)
      if (globalScale > 0.8 || (node.av?.sti || 0) > 100) {
        const fontSize = Math.max(10 / globalScale, 3);
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = `rgba(226, 232, 240, ${Math.min(1, globalScale * 0.7)})`;
        ctx.fillText(node.label, node.x, node.y + r + 2 / globalScale);
      }
    },
    [selectedNodeId],
  );

  /** Custom link renderer */
  const paintLink = useCallback((link, ctx, globalScale) => {
    const src = link.source;
    const tgt = link.target;
    if (!src || !tgt || typeof src.x === 'undefined') return;

    const alpha = 0.08 + (link.tv?.strength || 0.3) * 0.25;
    const linkColor = link.type === 'InheritanceLink'
      ? `rgba(0, 240, 255, ${alpha})`
      : link.type === 'SimilarityLink'
        ? `rgba(139, 92, 246, ${alpha})`
        : `rgba(100, 116, 139, ${alpha})`;

    ctx.strokeStyle = linkColor;
    ctx.lineWidth = 0.5 + (link.tv?.strength || 0.3) * 1.5;
    ctx.beginPath();
    ctx.moveTo(src.x, src.y);
    ctx.lineTo(tgt.x, tgt.y);
    ctx.stroke();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full relative grid-bg">
      <ForceGraph2D
        ref={fgRef}
        graphData={stableDataRef.current}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeCanvasObject={paintNode}
        nodeCanvasObjectMode={() => 'replace'}
        linkCanvasObject={paintLink}
        linkCanvasObjectMode={() => 'replace'}
        onNodeClick={(node) => onNodeSelect?.(node)}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        cooldownTicks={100}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
      {/* Legend overlay */}
      <div className="absolute bottom-3 left-3 glass-panel p-3 text-xs font-mono space-y-1 opacity-70 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(0, 60%, 50%)' }} />
          <span className="text-gray-400">Low Strength</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(80, 70%, 55%)' }} />
          <span className="text-gray-400">Mid Strength</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: 'hsl(160, 100%, 60%)' }} />
          <span className="text-gray-400">High Strength</span>
        </div>
        <div className="flex items-center gap-2 mt-1 pt-1 border-t border-white/10">
          <span className="text-gray-500">Size = Attention (STI)</span>
        </div>
      </div>
    </div>
  );
}
