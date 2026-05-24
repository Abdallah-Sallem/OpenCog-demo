/**
 * Node Inspector — Detail panel shown when a node is selected.
 */
export default function NodeInspector({ node, onStimulate, onClose }) {
  if (!node) return null;

  const sti = node.av?.sti ?? 0;
  const lti = node.av?.lti ?? 0;
  const strength = node.tv?.strength ?? 0;
  const confidence = node.tv?.confidence ?? 0;

  const stiPct = ((sti / 500) * 100).toFixed(0);
  const strengthColor = `hsl(${strength * 160}, ${50 + confidence * 50}%, ${40 + confidence * 20}%)`;

  return (
    <div className="glass-panel animate-slide-up absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-80">
      <div className="glass-panel-header">
        <div className="w-3 h-3 rounded-full" style={{ background: strengthColor }} />
        <h3 className="text-sm font-semibold text-gray-100 truncate">{node.label}</h3>
        <span className="neon-badge ml-1 text-[10px]">{node.type}</span>
        <button
          onClick={onClose}
          className="ml-auto text-gray-500 hover:text-gray-200 transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="p-4 space-y-3 text-xs">
        {/* Truth Value */}
        <div>
          <div className="text-gray-500 uppercase tracking-wider text-[10px] mb-1">Truth Value</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-white/5 p-2">
              <div className="text-gray-400">Strength</div>
              <div className="font-mono font-bold text-sm" style={{ color: strengthColor }}>
                {strength.toFixed(3)}
              </div>
              <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${strength * 100}%`, background: strengthColor }} />
              </div>
            </div>
            <div className="rounded-md bg-white/5 p-2">
              <div className="text-gray-400">Confidence</div>
              <div className="font-mono font-bold text-sm text-purple-400">{confidence.toFixed(3)}</div>
              <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${confidence * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Attention Value */}
        <div>
          <div className="text-gray-500 uppercase tracking-wider text-[10px] mb-1">Attention Value</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-white/5 p-2">
              <div className="text-gray-400">STI</div>
              <div className="font-mono font-bold text-sm text-neon-cyan">{sti.toFixed(1)}</div>
              <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-neon-cyan transition-all" style={{ width: `${stiPct}%` }} />
              </div>
            </div>
            <div className="rounded-md bg-white/5 p-2">
              <div className="text-gray-400">LTI</div>
              <div className="font-mono font-bold text-sm text-neon-amber">{lti.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* Stimulate button */}
        <button
          onClick={() => onStimulate?.(node.id, 80)}
          className="w-full py-1.5 rounded-lg text-xs font-semibold
                     bg-gradient-to-r from-cyan-500/15 to-emerald-500/15
                     border border-cyan-500/20 hover:border-cyan-500/40
                     text-neon-cyan hover:text-white transition-all"
        >
          ⚡ Stimulate Node (+80 STI)
        </button>
      </div>
    </div>
  );
}
