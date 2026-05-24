import { useEffect, useRef } from 'react';

const RULE_COLORS = {
  Deduction: { bg: 'rgba(0, 240, 255, 0.06)', border: 'rgba(0, 240, 255, 0.2)', text: '#00f0ff', badge: 'neon-badge' },
  Induction: { bg: 'rgba(139, 92, 246, 0.06)', border: 'rgba(139, 92, 246, 0.2)', text: '#8b5cf6', badge: 'neon-badge neon-badge--purple' },
  Abduction: { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', badge: 'neon-badge neon-badge--amber' },
  ModusPonens: { bg: 'rgba(16, 185, 129, 0.06)', border: 'rgba(16, 185, 129, 0.2)', text: '#10b981', badge: 'neon-badge neon-badge--emerald' },
};

/**
 * PLN Console — Scrolling log of logical rule evaluations.
 */
export default function PLNConsole({ plnLog }) {
  const scrollRef = useRef();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [plnLog]);

  return (
    <div className="glass-panel flex flex-col h-full">
      {/* Header */}
      <div className="glass-panel-header">
        <div className="w-2 h-2 rounded-full bg-neon-purple animate-pulse-glow" />
        <h2 className="text-sm font-semibold tracking-wide text-gray-200">PLN Console</h2>
        <span className="ml-auto text-xs font-mono text-gray-500">{plnLog.length} inferences</span>
      </div>

      {/* Rule legend */}
      <div className="px-4 py-2 flex flex-wrap gap-2 border-b border-white/5">
        {Object.entries(RULE_COLORS).map(([rule, style]) => (
          <span key={rule} className={style.badge} style={{ fontSize: '10px' }}>
            {rule}
          </span>
        ))}
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="glass-panel-body flex-1 overflow-y-auto space-y-1.5 font-mono text-xs">
        {plnLog.length === 0 && (
          <div className="text-gray-600 text-center py-8">Waiting for rule evaluations…</div>
        )}
        {plnLog.map((entry, i) => {
          const colors = RULE_COLORS[entry.rule] || RULE_COLORS.Deduction;
          return (
            <div
              key={`${entry.timestamp}-${i}`}
              className="rounded-lg p-2.5 animate-fade-in transition-all"
              style={{
                background: colors.bg,
                borderLeft: `2px solid ${colors.border}`,
              }}
            >
              {/* Rule name + symbol */}
              <div className="flex items-center gap-2 mb-1">
                <span className={colors.badge}>{entry.symbol} {entry.rule}</span>
                <span className="text-gray-600 text-[10px] ml-auto">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Premises */}
              <div className="text-gray-400 leading-relaxed pl-2">
                {entry.premises.map((p, j) => (
                  <div key={j} className="flex items-start gap-1">
                    <span className="text-gray-600 select-none">├</span>
                    <span>{p}</span>
                  </div>
                ))}
                <div className="flex items-start gap-1 mt-0.5">
                  <span style={{ color: colors.text }} className="select-none">∴</span>
                  <span style={{ color: colors.text }}>
                    {entry.conclusion}
                    <span className="text-gray-500 ml-2">
                      s={entry.tv.strength} c={entry.tv.confidence}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
