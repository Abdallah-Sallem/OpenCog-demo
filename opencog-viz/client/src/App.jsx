import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import AtomSpaceGraph from './components/AtomSpaceGraph';
import PLNConsole from './components/PLNConsole';
import ECANDashboard from './components/ECANDashboard';
import NodeInspector from './components/NodeInspector';
import DemoNarrator from './components/DemoNarrator';

export default function App() {
  const {
    connected,
    graphData,
    plnLog,
    ecanStats,
    ecanParams,
    tick,
    updateEcanParams,
    stimulateNode,
    globalStimulus,
  } = useSocket();

  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [highlightedLinks, setHighlightedLinks] = useState([]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="flex-none h-12 flex items-center justify-between px-5 border-b border-white/5"
              style={{ background: 'rgba(6,6,15,0.9)' }}>
        <div className="flex items-center gap-4">
          <div className="text-lg font-bold tracking-tight">
            <span className="text-neon-cyan">Open</span>
            <span className="text-gray-200">Cog</span>
            <span className="text-neon-purple ml-1.5 text-sm font-medium">Synergy Viz</span>
          </div>
          
          <DemoNarrator
            socketActions={{ updateParams: updateEcanParams, globalStimulus }}
            onHighlightChange={(nodes, links) => {
              setHighlightedNodes(nodes);
              setHighlightedLinks(links);
            }}
          />
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 text-gray-500">
            <span>TICK</span>
            <span className="text-neon-cyan">{tick}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>NODES</span>
            <span className="text-neon-purple">{graphData.nodes.length}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <span>LINKS</span>
            <span className="text-neon-emerald">{graphData.links.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-neon-emerald animate-pulse-glow' : 'bg-red-500'}`} />
            <span className={connected ? 'text-neon-emerald' : 'text-red-400'}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Grid ───────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — ECAN Controls */}
        <aside className="flex-none w-72 border-r border-white/5 overflow-hidden">
          <ECANDashboard
            ecanParams={ecanParams}
            ecanStats={ecanStats}
            tick={tick}
            onParamsChange={updateEcanParams}
            onGlobalStimulus={globalStimulus}
          />
        </aside>

        {/* Center — AtomSpace Graph */}
        <main className="flex-1 relative overflow-hidden">
          <AtomSpaceGraph
            graphData={graphData}
            onNodeSelect={(node) => setSelectedNode(node)}
            selectedNodeId={selectedNode?.id}
            highlightedNodeIds={highlightedNodes}
            highlightedLinks={highlightedLinks}
          />
          {/* Node Inspector overlay */}
          <NodeInspector
            node={selectedNode}
            onStimulate={stimulateNode}
            onClose={() => setSelectedNode(null)}
          />
        </main>

        {/* Right Panel — PLN Console */}
        <aside className="flex-none w-80 border-l border-white/5 overflow-hidden">
          <PLNConsole plnLog={plnLog} />
        </aside>
      </div>

      {/* ── Status Bar ──────────────────────────────────────────── */}
      <footer className="flex-none h-7 flex items-center justify-between px-5 border-t border-white/5 text-[10px] font-mono text-gray-600"
              style={{ background: 'rgba(6,6,15,0.95)' }}>
        <div className="flex items-center gap-4">
          <span>AtomSpace • PLN • ECAN</span>
          <span className="text-gray-700">|</span>
          <span>Cognitive Synergy Prototype</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Total STI: <span className="text-neon-cyan">{ecanStats.totalSTI?.toFixed(0) || '—'}</span></span>
          <span>Focus: <span className="text-neon-emerald">{ecanStats.inFocus || 0}</span></span>
          <span>Forgotten: <span className="text-neon-rose">{ecanStats.forgotten || 0}</span></span>
        </div>
      </footer>
    </div>
  );
}
