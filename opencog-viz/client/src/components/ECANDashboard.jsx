import { useState } from 'react';

const PARAM_CONFIG = [
  { key: 'rentRate', label: 'Rent Rate', min: 0, max: 0.2, step: 0.005, desc: 'STI decay per tick' },
  { key: 'wageRate', label: 'Wage Rate', min: 0, max: 0.5, step: 0.01, desc: 'STI boost for inference participation' },
  { key: 'spreadingRate', label: 'Spreading Rate', min: 0, max: 0.8, step: 0.01, desc: 'Attention propagation to neighbours' },
  { key: 'focusBoundary', label: 'Focus Boundary', min: 20, max: 300, step: 5, desc: 'STI threshold for attentional focus' },
];

/**
 * ECAN Dashboard — Live parameter controls and attention statistics.
 */
export default function ECANDashboard({
  ecanParams,
  ecanStats,
  tick,
  onParamsChange,
  onGlobalStimulus,
}) {
  const [localParams, setLocalParams] = useState({});

  const handleSliderChange = (key, value) => {
    const num = parseFloat(value);
    setLocalParams((prev) => ({ ...prev, [key]: num }));
    onParamsChange?.({ [key]: num });
  };

  const getValue = (key) => localParams[key] ?? ecanParams[key] ?? 0;

  const statItems = [
    { label: 'Total STI', value: ecanStats.totalSTI?.toFixed(0) || '—', color: '#00f0ff' },
    { label: 'In Focus', value: ecanStats.inFocus ?? '—', color: '#10b981' },
    { label: 'Forgotten', value: ecanStats.forgotten ?? '—', color: '#f43f5e' },
    { label: 'Avg STI', value: ecanStats.avgSTI?.toFixed(1) || '—', color: '#8b5cf6' },
    { label: 'Nodes', value: ecanStats.nodeCount ?? '—', color: '#f59e0b' },
  ];

  return (
    <div className="glass-panel flex flex-col h-full">
      {/* Header */}
      <div className="glass-panel-header">
        <div className="w-2 h-2 rounded-full bg-neon-emerald animate-pulse-glow" />
        <h2 className="text-sm font-semibold tracking-wide text-gray-200">ECAN Controls</h2>
        <span className="ml-auto text-xs font-mono text-gray-500">tick #{tick}</span>
      </div>

      <div className="glass-panel-body flex-1 overflow-y-auto space-y-5">
        {/* ── Stats Grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {statItems.map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-2 text-center"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
            >
              <div className="text-lg font-bold font-mono" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Attention Bar ─────────────────────────────────────── */}
        <div>
          <div className="text-xs text-gray-400 mb-1.5 font-medium">Attention Distribution</div>
          <div className="h-3 rounded-full overflow-hidden bg-white/5 flex">
            {ecanStats.nodeCount > 0 && (
              <>
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${((ecanStats.inFocus || 0) / ecanStats.nodeCount) * 100}%`,
                    background: 'linear-gradient(90deg, #10b981, #00f0ff)',
                  }}
                />
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(((ecanStats.nodeCount - (ecanStats.inFocus || 0) - (ecanStats.forgotten || 0)) / ecanStats.nodeCount) * 100)}%`,
                    background: 'rgba(139, 92, 246, 0.4)',
                  }}
                />
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${((ecanStats.forgotten || 0) / ecanStats.nodeCount) * 100}%`,
                    background: 'rgba(244, 63, 94, 0.3)',
                  }}
                />
              </>
            )}
          </div>
          <div className="flex justify-between text-[10px] mt-1 text-gray-600">
            <span className="text-neon-emerald">Focused</span>
            <span className="text-purple-400">Active</span>
            <span className="text-neon-rose">Forgotten</span>
          </div>
        </div>

        {/* ── Parameter Sliders ─────────────────────────────────── */}
        <div className="space-y-4">
          <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Parameters</div>
          {PARAM_CONFIG.map((p) => (
            <div key={p.key}>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-xs text-gray-300">{p.label}</label>
                <span className="text-xs font-mono text-neon-cyan">
                  {typeof getValue(p.key) === 'number' ? getValue(p.key).toFixed(p.step < 0.01 ? 3 : 2) : '—'}
                </span>
              </div>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={getValue(p.key)}
                onChange={(e) => handleSliderChange(p.key, e.target.value)}
                className="w-full"
                id={`ecan-slider-${p.key}`}
              />
              <div className="text-[10px] text-gray-600 mt-0.5">{p.desc}</div>
            </div>
          ))}
        </div>

        {/* ── Actions ───────────────────────────────────────────── */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <button
            id="btn-global-stimulus"
            onClick={() => onGlobalStimulus?.(300)}
            className="w-full py-2 rounded-lg text-xs font-semibold tracking-wide
                       bg-gradient-to-r from-cyan-500/20 to-purple-500/20
                       border border-cyan-500/20 hover:border-cyan-500/40
                       text-neon-cyan hover:text-white
                       transition-all duration-200 hover:shadow-neon-cyan"
          >
            ⚡ Global Stimulus (+300)
          </button>
          <button
            id="btn-attention-reset"
            onClick={() => {
              onParamsChange?.({ rentRate: 0.04, wageRate: 0.15, spreadingRate: 0.25, focusBoundary: 100 });
              setLocalParams({});
            }}
            className="w-full py-2 rounded-lg text-xs font-semibold tracking-wide
                       bg-white/5 border border-white/10 hover:border-white/20
                       text-gray-400 hover:text-gray-200
                       transition-all duration-200"
          >
            ↺ Reset Parameters
          </button>
        </div>
      </div>
    </div>
  );
}
